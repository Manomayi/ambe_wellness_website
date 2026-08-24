"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import BackButton from '@/components/common/BackButton';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  HeartIcon,
  Cog6ToothIcon,
  SunIcon,
  SparklesIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Mirrors the mobile app's report-submission flow (see
// lib/features/doctor/consultations/post_consultation/checkout_page.dart
// and store_recommendations_page.dart) so a report submitted from either
// platform writes the exact same Firestore documents and shows up
// identically wherever it's viewed — admin, app, or web. Doctor referral
// remains app-only for now; product recommendations now have parity.
const CATEGORIES = [
  { key: 'lifestyle', label: 'Lifestyle', icon: HeartIcon },
  { key: 'diet', label: 'Diet', icon: SunIcon },
  { key: 'exercise', label: 'Exercise', icon: Cog6ToothIcon },
  { key: 'yoga_meditation', label: 'Yoga & Meditation', icon: SparklesIcon },
];

export default function CompleteReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const userUid = searchParams.get('userUid');
  const userName = searchParams.get('userName') || 'Patient';
  const timeMillis = searchParams.get('time');

  const [notesByCategory, setNotesByCategory] = useState({
    lifestyle: '',
    diet: '',
    exercise: '',
    yoga_meditation: '',
  });
  const [overallNotes, setOverallNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Product recommendations — the `store` collection's documents each hold
  // a `products` array (see store_recommendations_page.dart), which is
  // flattened here into one flat list to search/pick from.
  const [storeProducts, setStoreProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [pickerSelections, setPickerSelections] = useState({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'store'));
        const flattened = [];
        snap.docs.forEach((shopDoc) => {
          const products = shopDoc.data().products || [];
          products.forEach((product, index) => {
            if (product?.product_name && Array.isArray(product.packs)) {
              // The same product name can appear in more than one shop
              // document, so product_name alone isn't a safe identity —
              // this composite key is used for React list keys, picker
              // selection state, and the add-to-list lookup below.
              flattened.push({
                ...product,
                shop_id: shopDoc.id,
                productKey: `${shopDoc.id}_${index}`,
              });
            }
          });
        });
        setStoreProducts(flattened);
      } catch (err) {
        console.error('Error loading store products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const updateCategory = (key, value) => {
    setNotesByCategory((prev) => ({ ...prev, [key]: value }));
  };

  const setPickerSelection = (productKey, field, value) => {
    setPickerSelections((prev) => ({
      ...prev,
      [productKey]: { ...prev[productKey], [field]: value },
    }));
  };

  const addProductToRecommendations = (product) => {
    const selection = pickerSelections[product.productKey] || {};
    const size = selection.size;
    const quantity = selection.quantity || 0;
    if (!size || quantity <= 0) return;

    const pack = product.packs.find((p) => p.size === size);
    if (!pack) return;

    // Same field shape UserCartItem.toJson() produces in the app, so
    // report viewers and the patient's cart read identical data regardless
    // of which platform the report was submitted from. item_id includes
    // shop_id so recommending the same product from two different shops
    // doesn't collide into a single cart entry.
    const itemId = `${product.productKey}_${size}`.replace(/\s+/g, '_');
    const newItem = {
      item_id: itemId,
      product_id: product.product_id || null,
      product_name: product.product_name,
      size,
      mrp: Number(pack.mrp) || 0,
      price: pack.price != null ? Number(pack.price) : null,
      shop_id: product.shop_id || null,
      quantity,
      doctor_recommended: true,
    };
    setRecommendedProducts((prev) => {
      // Adding the same product+size again merges quantity into the
      // existing entry instead of appending a second one with the same
      // item_id (which would collide as a React list key and, more
      // importantly, silently overwrite the same cart document on submit).
      const existingIndex = prev.findIndex((item) => item.item_id === itemId);
      if (existingIndex === -1) return [...prev, newItem];
      const updated = [...prev];
      updated[existingIndex] = { ...newItem, quantity: updated[existingIndex].quantity + quantity };
      return updated;
    });
    setPickerSelections((prev) => ({ ...prev, [product.productKey]: {} }));
  };

  const removeRecommendedProduct = (itemId) => {
    setRecommendedProducts((prev) => prev.filter((item) => item.item_id !== itemId));
  };

  const filteredProducts = storeProducts.filter((p) =>
    p.product_name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userUid || !timeMillis) {
      setError('Missing appointment details — please return to Consultations and try again.');
      return;
    }
    const missing = CATEGORIES.filter((c) => !notesByCategory[c.key].trim());
    if (missing.length > 0) {
      setError(`Please provide recommendations for: ${missing.map((c) => c.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const doctorUid = user.uid;
      const time = Timestamp.fromMillis(Number(timeMillis));
      const oldAppointmentId = params.id;

      const recommendations = {};
      for (const cat of CATEGORIES) {
        recommendations[cat.key] = { notes: notesByCategory[cat.key].trim() };
      }

      // Same document ID scheme as the mobile app, so the doctor's and
      // patient's history entries for this report line up.
      const pad = (n) => String(n).padStart(2, '0');
      const d = time.toDate();
      const formattedTimestamp =
        `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_` +
        `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
      const documentId = `${formattedTimestamp}_${doctorUid}`;

      const userDataToSave = {
        doctor_uid: doctorUid,
        doctor_name: user.displayName,
        time,
        recommendations,
        user_id: userUid,
        user_name: userName,
        notes: overallNotes.trim(),
        store_recommendations: recommendedProducts,
      };

      const batch = writeBatch(db);

      batch.set(
        doc(db, 'users', userUid, 'appointments_history', documentId),
        userDataToSave,
        { merge: true }
      );

      batch.delete(doc(db, 'users', userUid, 'appointments_upcoming', oldAppointmentId));
      batch.delete(doc(db, 'doctors', doctorUid, 'appointments_upcoming', oldAppointmentId));

      batch.delete(doc(db, 'doctors', doctorUid, 'appointments_reports_to_finish', documentId));
      if (oldAppointmentId && oldAppointmentId !== documentId) {
        batch.delete(doc(db, 'doctors', doctorUid, 'appointments_reports_to_finish', oldAppointmentId));
      }

      batch.set(doc(db, 'doctors', doctorUid, 'appointments_history', documentId), {
        user_id: userUid,
        user_name: userName,
        time,
        document_id: documentId,
        updated_at: serverTimestamp(),
        recommendations,
        notes: overallNotes.trim(),
      });

      batch.update(doc(db, 'doctors', doctorUid), {
        'pending.finish_report': -1,
      });

      // Add recommended products to the patient's cart — same step
      // checkout_page.dart performs (its batch step 4).
      for (const item of recommendedProducts) {
        batch.set(doc(db, 'users', userUid, 'cart', item.item_id), item);
      }

      await batch.commit();

      // Add/update the patient in the doctor's "My Patients" list — same
      // best-effort, non-blocking pattern checkout_page.dart uses.
      try {
        const userSnap = await getDoc(doc(db, 'users', userUid));
        const userData = userSnap.exists() ? userSnap.data() : null;
        if (userData) {
          const patientBatch = writeBatch(db);
          patientBatch.set(
            doc(db, 'doctors', doctorUid, 'users', userUid),
            {
              name: userName,
              email: userData.email || null,
              profile_picture: userData.profile_picture || null,
              phone_number: userData.phone_number || null,
              matched_at: serverTimestamp(),
              last_consultation: serverTimestamp(),
            },
            { merge: true }
          );
          await patientBatch.commit();
        }
      } catch (patientErr) {
        console.error('Error adding patient to list:', patientErr);
      }

      router.push('/doctor/consultations');
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute userType="doctor">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <BackButton href="/doctor/consultations" label="Back to Consultations" />

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#F4F1EA] flex items-center justify-center mb-3">
              <HeartIcon className="w-7 h-7 text-[#C8996A]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">
              Consultation for {userName}
            </h1>
            <p className="text-[#6B6862] mt-1">Please provide your recommendations</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {CATEGORIES.map(({ key, label, icon: Icon }) => (
              <div key={key} className="bg-[#FAF8F5] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F4F1EA] flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#C8996A]" />
                  </div>
                  <h3 className="font-semibold text-[#1A1A1A]">{label}</h3>
                </div>
                <textarea
                  value={notesByCategory[key]}
                  onChange={(e) => updateCategory(key, e.target.value)}
                  rows={3}
                  placeholder="Add your recommendations and notes here..."
                  className="w-full rounded-lg border border-[#E7E2D9] p-3 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C8996A]"
                />
              </div>
            ))}

            <div className="bg-[#FAF8F5] rounded-lg p-5">
              <h3 className="font-semibold text-[#1A1A1A] mb-3">Notes</h3>
              <textarea
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                rows={4}
                placeholder="Any additional notes for this consultation..."
                className="w-full rounded-lg border border-[#E7E2D9] p-3 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C8996A]"
              />
            </div>

            {/* Recommended Products */}
            <div className="bg-[#FAF8F5] rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#F4F1EA] flex items-center justify-center">
                  <ShoppingBagIcon className="w-5 h-5 text-[#C8996A]" />
                </div>
                <h3 className="font-semibold text-[#1A1A1A]">Recommended Products</h3>
              </div>

              {recommendedProducts.length > 0 && (
                <div className="space-y-2 mb-4">
                  {recommendedProducts.map((item) => (
                    <div
                      key={item.item_id}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#E7E2D9]"
                    >
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{item.product_name}</p>
                        <p className="text-sm text-[#6B6862]">
                          {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecommendedProduct(item.item_id)}
                        className="text-[#6B6862] hover:text-red-600 p-1"
                        aria-label={`Remove ${item.product_name}`}
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-lg border border-[#E7E2D9] p-2.5 text-[#1A1A1A] mb-3 focus:outline-none focus:ring-2 focus:ring-[#C8996A]"
              />

              {productsLoading ? (
                <p className="text-sm text-[#6B6862]">Loading products...</p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-sm text-[#6B6862]">No products found.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const selection = pickerSelections[product.productKey] || {};
                    return (
                      <div
                        key={product.productKey}
                        className="bg-white rounded-lg p-3 border border-[#E7E2D9] flex items-center gap-3"
                      >
                        <span className="flex-1 text-[#1A1A1A] text-sm font-medium">
                          {product.product_name}
                        </span>
                        <select
                          value={selection.size || ''}
                          onChange={(e) => setPickerSelection(product.productKey, 'size', e.target.value)}
                          className="border border-[#E7E2D9] rounded-lg text-sm p-1.5 text-[#1A1A1A]"
                        >
                          <option value="">Size</option>
                          {product.packs.map((pack) => (
                            <option key={pack.size} value={pack.size}>{pack.size}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={selection.quantity || ''}
                          onChange={(e) => setPickerSelection(product.productKey, 'quantity', Number(e.target.value))}
                          placeholder="Qty"
                          className="w-16 border border-[#E7E2D9] rounded-lg text-sm p-1.5 text-[#1A1A1A]"
                        />
                        <button
                          type="button"
                          onClick={() => addProductToRecommendations(product)}
                          disabled={!selection.size || !selection.quantity}
                          className="bg-[#FFD3AC] text-[#1A1A1A] text-sm font-medium px-3 py-1.5 rounded-lg disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FFD3AC] text-[#1A1A1A] hover:text-white py-4 rounded-lg hover:bg-[#1A1A1A] transition font-medium disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
