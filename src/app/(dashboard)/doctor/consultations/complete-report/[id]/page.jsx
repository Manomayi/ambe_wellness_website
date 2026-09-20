"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import BackButton from '@/components/common/BackButton';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { classifyOutcome } from '@/lib/refundPolicy';
import { generateCartItemId } from '@/lib/cartUtils';
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

    // Same deterministic item_id logic that UserCartItem.generateItemId() produces in the app,
    // so cart entries and doctor recommendations merge seamlessly across web and mobile.
    const itemId = generateCartItemId(product.product_name, size, product.product_id);
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

      // Use the canonical appointment ID matching the mobile app so all
      // documents and history entries share the exact same ID.
      const documentId = oldAppointmentId;

      // Fetch existing upcoming / consultation doc data to preserve payment_id, consultation_id, and attendance
      let existingApptData = {};
      try {
        const upSnap = await getDoc(doc(db, 'users', userUid, 'appointments_upcoming', oldAppointmentId));
        if (upSnap.exists()) {
          existingApptData = upSnap.data();
        }
      } catch (_) {}
      try {
        const cSnap = await getDoc(doc(db, 'consultations', oldAppointmentId));
        if (cSnap.exists()) {
          existingApptData = { ...cSnap.data(), ...existingApptData };
        }
      } catch (_) {}

      // Attendance comes from the live consultation document, which each
      // client stamps as it joins the call. It must NEVER be hardcoded here:
      // writing `user_joined: true` unconditionally told the refund page that
      // the patient attended even when the doctor sat alone and hung up, which
      // is what turned a patient no-show into a full $50 refund.
      const userJoined = existingApptData.user_joined === true;
      const doctorJoined = existingApptData.doctor_joined === true;
      const outcomeStatus = classifyOutcome({ userJoined, doctorJoined });

      const userDataToSave = {
        ...existingApptData,
        doctor_uid: doctorUid,
        doctor_id: doctorUid,
        // `displayName` is unset on most doctor accounts, so prefer whatever
        // name the consultation already carries rather than storing null and
        // letting every surface fall back to "Assigned Doctor".
        doctor_name: existingApptData.doctor_name || user.displayName || null,
        time,
        recommendations,
        user_id: userUid,
        user_name: userName,
        notes: overallNotes.trim(),
        store_recommendations: recommendedProducts,
        recommendations_added_to_cart: true,
        appointment_id: documentId,
        original_appointment_id: oldAppointmentId,
        consultation_id: oldAppointmentId,
        status: outcomeStatus,
        consultation_outcome: outcomeStatus,
        user_joined: userJoined,
        doctor_joined: doctorJoined,
        updated_at: serverTimestamp(),
      };

      const batch = writeBatch(db);

      batch.set(
        doc(db, 'users', userUid, 'appointments_history', documentId),
        userDataToSave,
        { merge: true }
      );

      // Keep consultation doc updated with completed status and clinical report
      batch.set(
        doc(db, 'consultations', oldAppointmentId),
        {
          // The real outcome, not a blanket "completed" — the earning trigger
          // and the refund policy both read this document.
          status: outcomeStatus,
          consultation_outcome: outcomeStatus,
          call_status: 'ended',
          call_ended_by: 'doctor',
          call_ended_at: serverTimestamp(),
          doctor_id: doctorUid,
          user_id: userUid,
          user_name: userName,
          history_appointment_id: documentId,
          recommendations,
          notes: overallNotes.trim(),
          store_recommendations: recommendedProducts,
          recommendations_added_to_cart: true,
          updated_at: serverTimestamp(),
        },
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
        appointment_id: oldAppointmentId,
        consultation_id: oldAppointmentId,
        updated_at: serverTimestamp(),
        recommendations,
        notes: overallNotes.trim(),
        store_recommendations: recommendedProducts,
      });

      batch.update(doc(db, 'doctors', doctorUid), {
        'pending.finish_report': increment(-1),
      });

      batch.set(
        doc(db, 'users', userUid),
        {
          is_consultation_set: false,
          is_first_consultation_completed: true,
        },
        { merge: true }
      );

      // Add recommended products to the patient's cart — same step
      // checkout_page.dart performs (its batch step 4).
      for (const item of recommendedProducts) {
        batch.set(doc(db, 'users', userUid, 'cart', item.item_id), item, { merge: true });
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
      <WebLayoutWrapper>
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-4 pt-2">
            <AmbeBackButton onClick={() => router.push('/doctor/consultations')} />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Consultation Report
            </h1>
          </div>

          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
            <div className="text-center pb-2 border-b border-white/10">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 flex items-center justify-center mb-3">
                <HeartIcon className="w-7 h-7 text-[#FFD3AC]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Consultation for {userName}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">Please provide your medical recommendations</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl p-3.5 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <div key={key} className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFD3AC]/15 border border-[#FFD3AC]/25 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#FFD3AC]" />
                    </div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">{label}</h3>
                  </div>
                  <textarea
                    value={notesByCategory[key]}
                    onChange={(e) => updateCategory(key, e.target.value)}
                    rows={3}
                    placeholder="Add your recommendations and notes here..."
                    className="w-full rounded-xl bg-white/5 border border-white/15 p-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] focus:border-[#FFD3AC] text-sm leading-relaxed resize-none"
                  />
                </div>
              ))}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                <h3 className="font-semibold text-white text-sm sm:text-base mb-3">Additional Notes</h3>
                <textarea
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional notes for this consultation..."
                  className="w-full rounded-xl bg-white/5 border border-white/15 p-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] focus:border-[#FFD3AC] text-sm leading-relaxed resize-none"
                />
              </div>

              {/* Recommended Products */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFD3AC]/15 border border-[#FFD3AC]/25 flex items-center justify-center shrink-0">
                    <ShoppingBagIcon className="w-5 h-5 text-[#FFD3AC]" />
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base">Recommended Products</h3>
                </div>

                {recommendedProducts.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {recommendedProducts.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-white/10"
                      >
                        <div>
                          <p className="font-medium text-white text-sm">{item.product_name}</p>
                          <p className="text-xs text-white/60">
                            {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRecommendedProduct(item.item_id)}
                          className="text-white/60 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
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
                  placeholder="Search products to recommend..."
                  className="w-full rounded-xl bg-black/30 border border-white/15 p-3 text-white placeholder-white/40 mb-3 focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] focus:border-[#FFD3AC] text-sm"
                />

                {productsLoading ? (
                  <p className="text-xs text-white/60">Loading products...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-xs text-white/60">No products found.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredProducts.map((product) => {
                      const selection = pickerSelections[product.productKey] || {};
                      return (
                        <div
                          key={product.productKey}
                          className="bg-black/20 rounded-xl p-3 border border-white/10 flex items-center gap-3 flex-wrap sm:flex-nowrap"
                        >
                          <span className="flex-1 text-white text-sm font-medium min-w-[120px]">
                            {product.product_name}
                          </span>
                          <select
                            value={selection.size || ''}
                            onChange={(e) => setPickerSelection(product.productKey, 'size', e.target.value)}
                            className="border border-white/15 bg-[#2D2D30] rounded-lg text-xs p-2 text-white outline-none focus:border-[#FFD3AC]"
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
                            className="w-16 border border-white/15 bg-[#2D2D30] rounded-lg text-xs p-2 text-white outline-none focus:border-[#FFD3AC]"
                          />
                          <button
                            type="button"
                            onClick={() => addProductToRecommendations(product)}
                            disabled={!selection.size || !selection.quantity}
                            className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] text-xs font-semibold px-3.5 py-2 rounded-lg disabled:opacity-40 transition cursor-pointer"
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
                className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-4 rounded-full font-bold transition shadow-lg text-base disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
