'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { generateCartItemId } from '@/lib/cartUtils';
import { format } from 'date-fns';
import BackButton from '@/components/common/BackButton';
import Link from 'next/link';
import {
  CalendarDaysIcon,
  UserIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  ChatBubbleLeftEllipsisIcon,
  SparklesIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  ArrowTopRightOnSquareIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { getConsultationStatusInfo } from '@/lib/consultationStatus';

export default function ConsultationReportPage() {
  const router = useRouter();
  const { documentID } = useParams();
  const searchParams = useSearchParams();
  const queryDoctorName = searchParams.get('doctorName') || '';
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartItemsMap, setCartItemsMap] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push('/login');
      setCurrentUser(user);
      if (!documentID) {
        setLoading(false);
        return;
      }

      try {
        let foundData = null;

        // 1. Primary: users/{uid}/appointments_history/{documentID}
        try {
          const snap = await getDoc(
            doc(db, 'users', user.uid, 'appointments_history', documentID)
          );
          if (snap.exists() && snap.data()) {
            foundData = snap.data();
          }
        } catch (e) {
          console.warn('Direct doc lookup failed:', e);
        }

        // 2. Query where document_id == documentID in appointments_history
        if (!foundData) {
          try {
            const qDocId = query(
              collection(db, 'users', user.uid, 'appointments_history'),
              where('document_id', '==', documentID),
              limit(1)
            );
            const qSnap = await getDocs(qDocId);
            if (!qSnap.empty) {
              foundData = qSnap.docs[0].data();
            }
          } catch (e) {}
        }

        // 3. Query where appointment_id == documentID in appointments_history
        if (!foundData) {
          try {
            const qApptId = query(
              collection(db, 'users', user.uid, 'appointments_history'),
              where('appointment_id', '==', documentID),
              limit(1)
            );
            const qSnap = await getDocs(qApptId);
            if (!qSnap.empty) {
              foundData = qSnap.docs[0].data();
            }
          } catch (e) {}
        }

        // 4. Fallback: users/{uid}/consultations_completed/{documentID}
        if (!foundData) {
          try {
            const compSnap = await getDoc(
              doc(db, 'users', user.uid, 'consultations_completed', documentID)
            );
            if (compSnap.exists() && compSnap.data()) {
              foundData = compSnap.data();
            }
          } catch (e) {}
        }

        // 5. Fallback: root consultations/{documentID}
        if (!foundData) {
          try {
            const consultSnap = await getDoc(
              doc(db, 'consultations', documentID)
            );
            if (consultSnap.exists() && consultSnap.data()) {
              foundData = consultSnap.data();
            }
          } catch (e) {}
        }

        setData(foundData);
      } catch (err) {
        console.error('Error fetching consultation report:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [documentID, router]);

  // Real-time cart listener to track items currently in cart
  useEffect(() => {
    if (!currentUser) return;
    const unsubCart = onSnapshot(collection(db, 'users', currentUser.uid, 'cart'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.id] = true;
        const cData = d.data();
        if (cData.item_id) map[cData.item_id] = true;
        if (cData.product_name && cData.size) {
          map[`${cData.product_name}_${cData.size}`] = true;
          map[generateCartItemId(cData.product_name, cData.size, cData.product_id)] = true;
        }
      });
      setCartItemsMap(map);
    });
    return () => unsubCart();
  }, [currentUser]);

  // Auto-sync recommendations to cart only once (if not previously added or purchased)
  useEffect(() => {
    if (!currentUser || !data) return;
    if (data.recommendations_added_to_cart === true) return;
    const storeRecs = data.store_recommendations || data.storeRecommendations || [];
    if (!Array.isArray(storeRecs) || storeRecs.length === 0) return;

    const syncToCart = async () => {
      try {
        // Mark as added immediately on appointment history and consultation doc so this never repeats
        const apptHistoryId = data.document_id || documentID;
        const reportRef = doc(db, 'users', currentUser.uid, 'appointments_history', apptHistoryId);
        await setDoc(reportRef, { recommendations_added_to_cart: true }, { merge: true }).catch(() => {});
        const masterApptId = data.appointment_id || data.consultation_id;
        if (masterApptId) {
          await setDoc(doc(db, 'consultations', masterApptId), { recommendations_added_to_cart: true }, { merge: true }).catch(() => {});
        }

        // Check user's purchase history - if already purchased, do not re-add to cart!
        const purchasesSnap = await getDocs(collection(db, 'users', currentUser.uid, 'purchases'));
        const purchasedKeys = new Set();
        purchasesSnap.docs.forEach((pDoc) => {
          const pData = pDoc.data();
          const pItems = Array.isArray(pData.items) ? pData.items : [];
          pItems.forEach((it) => {
            const itName = String(it.product_name || it.productName || '').toLowerCase().trim();
            const itSize = String(it.size || '').toLowerCase().trim();
            if (itName) {
              purchasedKeys.add(`${itName}_${itSize}`);
              if (it.item_id) purchasedKeys.add(it.item_id);
            }
          });
        });

        let storeCatalog = null;
        for (const item of storeRecs) {
          const pName = item.product_name || item.productName;
          const pSize = item.size || '';
          if (!pName || !pSize) continue;
          const itemKey = `${String(pName).toLowerCase().trim()}_${String(pSize).toLowerCase().trim()}`;
          const pId = item.product_id || item.productId || null;
          const itemId = generateCartItemId(pName, pSize, pId);

          // Skip if already purchased in an earlier order
          if (purchasedKeys.has(itemKey) || (item.item_id && purchasedKeys.has(item.item_id)) || purchasedKeys.has(itemId)) {
            continue;
          }

          const cartDocRef = doc(db, 'users', currentUser.uid, 'cart', itemId);
          const cartDocSnap = await getDoc(cartDocRef);
          if (!cartDocSnap.exists()) {
            let mrp = Number(item.mrp) || 0;
            let price = item.price != null ? Number(item.price) : null;
            let shopId = item.shop_id || null;

            if (mrp <= 0) {
              if (!storeCatalog) {
                const storeSnap = await getDocs(collection(db, 'store'));
                storeCatalog = [];
                storeSnap.docs.forEach((sDoc) => {
                  const prods = sDoc.data().products || [];
                  prods.forEach((p) => storeCatalog.push({ ...p, shop_id: sDoc.id }));
                });
              }
              const matchedProduct = storeCatalog.find(
                (p) =>
                  (p.product_id && p.product_id === pId) ||
                  (p.product_name && p.product_name.toLowerCase().trim() === pName.toLowerCase().trim())
              );
              if (matchedProduct) {
                shopId = shopId || matchedProduct.shop_id;
                const matchedPack = (matchedProduct.packs || []).find((pack) => pack.size === pSize);
                if (matchedPack) {
                  mrp = Number(matchedPack.mrp) || mrp;
                  price = matchedPack.price != null ? Number(matchedPack.price) : price;
                }
              }
            }

            await setDoc(
              cartDocRef,
              {
                item_id: itemId,
                product_id: pId,
                product_name: pName,
                size: pSize,
                mrp: mrp,
                price: price,
                shop_id: shopId,
                quantity: Number(item.quantity || item.qty) || 1,
                doctor_recommended: true,
              },
              { merge: true }
            );
          }
        }
      } catch (err) {
        console.warn('Auto-sync recommendations to cart failed:', err);
      }
    };

    syncToCart();
  }, [currentUser, data]);

  const handleAddToCart = async (item) => {
    if (!currentUser || !item) return;
    const pName = item.product_name || item.productName;
    const pSize = item.size || '';
    if (!pName) return;
    const pId = item.product_id || item.productId || null;
    const itemId = generateCartItemId(pName, pSize, pId);

    try {
      let mrp = Number(item.mrp) || 0;
      let price = item.price != null ? Number(item.price) : null;
      let shopId = item.shop_id || null;

      if (mrp <= 0) {
        const storeSnap = await getDocs(collection(db, 'store'));
        for (const sDoc of storeSnap.docs) {
          const prods = sDoc.data().products || [];
          for (const p of prods) {
            if (
              (p.product_id && p.product_id === pId) ||
              (p.product_name && p.product_name.toLowerCase().trim() === pName.toLowerCase().trim())
            ) {
              shopId = shopId || sDoc.id;
              const pack = (p.packs || []).find((pk) => pk.size === pSize);
              if (pack) {
                mrp = Number(pack.mrp) || mrp;
                price = pack.price != null ? Number(pack.price) : price;
              }
              break;
            }
          }
          if (shopId && mrp > 0) break;
        }
      }

      await setDoc(
        doc(db, 'users', currentUser.uid, 'cart', itemId),
        {
          item_id: itemId,
          product_id: pId,
          product_name: pName,
          size: pSize,
          mrp: mrp,
          price: price,
          shop_id: shopId,
          quantity: Number(item.quantity || item.qty) || 1,
          doctor_recommended: true,
        },
        { merge: true }
      );
      alert(`${pName} added to cart!`);
    } catch (err) {
      console.error('Error adding item to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-3 border-[#C8996A] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <BackButton label="Back to Consultations" href="/user/consult" />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-12 text-center shadow-sm">
          <DocumentTextIcon className="h-16 w-16 text-[#8C827A]/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No Report Found</h2>
          <p className="text-sm text-[#6B6862] mb-6">
            We couldn't locate a completed report for this consultation.
          </p>
          <button
            onClick={() => router.push('/user/consult')}
            className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-2.5 rounded-full text-sm font-semibold transition"
          >
            Return to Consultations
          </button>
        </div>
      </div>
    );
  }

  const recommendations = data.recommendations || null;
  const storeRecommendations = data.store_recommendations || data.storeRecommendations || [];
  const notes = data.notes || '';
  const referral = data.referral || null;
  const doctorName = data.doctor_name || queryDoctorName || 'Integrative Doctor';

  const appointmentTime = data.time || data.appointment_time || data.created_at;
  let formattedDate = null;
  if (appointmentTime) {
    try {
      const d = appointmentTime.toDate ? appointmentTime.toDate() : new Date(appointmentTime);
      formattedDate = format(d, 'MMMM d, yyyy • h:mm a');
    } catch (e) {}
  }

  const hasReportContent = 
    (recommendations && Object.keys(recommendations).length > 0) ||
    (storeRecommendations && storeRecommendations.length > 0) ||
    Boolean(notes) ||
    Boolean(referral);

  const statusInfo = getConsultationStatusInfo(data);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <BackButton label="Back to Consultations" href="/user/consult" />

      {/* Header Banner */}
      <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                {statusInfo.label}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
              {statusInfo.isCancelled
                ? 'Cancelled Consultation'
                : statusInfo.isMissed
                ? (statusInfo.statusKey === 'doctor_absent' ? 'Doctor Absent' : 'Missed Consultation')
                : 'Consultation Report'}
            </h1>
            <p className="text-sm text-[#6B6862] mt-1">
              {statusInfo.isCancelled
                ? 'This scheduled consultation was cancelled.'
                : statusInfo.isMissed
                ? (statusInfo.statusKey === 'doctor_absent'
                    ? 'The assigned doctor was absent for the scheduled video session.'
                    : 'This scheduled video consultation was not attended.')
                : 'Personalized wellness protocol and treatment guidance.'}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1 bg-white border border-[#E7E2D9] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
              <UserIcon className="w-4 h-4 text-[#C8996A]" />
              Dr. {doctorName}
            </div>
            {formattedDate && (
              <div className="flex items-center gap-2 text-xs text-[#6B6862]">
                <CalendarDaysIcon className="w-4 h-4 text-[#8C827A]" />
                {formattedDate}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancelled Consultation View */}
      {statusInfo.isCancelled && (
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 sm:p-12 text-center shadow-sm">
          <XCircleIcon className="h-16 w-16 text-red-500/80 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Consultation Cancelled</h2>
          <p className="text-sm text-[#6B6862] max-w-lg mx-auto mb-6 leading-relaxed">
            {statusInfo.statusKey === 'cancelled_by_doctor'
              ? 'This consultation was cancelled by the healthcare provider. You are eligible for a 100% full refund on your deposit or you may schedule a new consultation with another doctor.'
              : 'This consultation was cancelled by you. No clinical report or wellness protocol is generated for cancelled consultations. If eligible under our cancellation policy, you can view and claim your deposit refund in the Refunds section.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/user/menu/refunds"
              className="inline-flex items-center gap-2 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-5 py-2.5 rounded-full text-xs font-semibold transition"
            >
              <InformationCircleIcon className="w-4 h-4" />
              View Refund Status
            </Link>
            <Link
              href="/user/consult/schedule"
              className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#E7E2D9] hover:border-[#C8996A] px-5 py-2.5 rounded-full text-xs font-semibold text-[#1A1A1A] transition"
            >
              <CalendarDaysIcon className="w-4 h-4 text-[#C8996A]" />
              Book New Consultation
            </Link>
          </div>
        </div>
      )}

      {/* Missed Consultation View */}
      {statusInfo.isMissed && (
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 sm:p-12 text-center shadow-sm">
          <ClockIcon className="h-16 w-16 text-amber-600/80 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">
            {statusInfo.statusKey === 'doctor_absent' ? 'Doctor Absent' : 'Missed Consultation'}
          </h2>
          <p className="text-sm text-[#6B6862] max-w-lg mx-auto mb-6 leading-relaxed">
            {statusInfo.statusKey === 'doctor_absent'
              ? 'Your assigned doctor was unable to attend the scheduled video consultation. Under our policy, you are entitled to a 100% full refund of your deposit, or you can reschedule at your convenience.'
              : 'This video consultation was missed because the session was not attended. As per our missed consultation policy, no personalized wellness protocol is generated, and you are eligible for a 50% deposit refund ($25.00 USD).'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/user/menu/refunds"
              className="inline-flex items-center gap-2 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-5 py-2.5 rounded-full text-xs font-semibold transition"
            >
              <InformationCircleIcon className="w-4 h-4" />
              Claim 50% Refund
            </Link>
            <Link
              href="/user/consult/schedule"
              className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#E7E2D9] hover:border-[#C8996A] px-5 py-2.5 rounded-full text-xs font-semibold text-[#1A1A1A] transition"
            >
              <CalendarDaysIcon className="w-4 h-4 text-[#C8996A]" />
              Schedule Consultation
            </Link>
          </div>
        </div>
      )}

      {/* If completed but doctor hasn't submitted details yet */}
      {statusInfo.isCompleted && !hasReportContent && (
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 sm:p-12 text-center shadow-sm">
          <ClockIcon className="h-16 w-16 text-[#C8996A] mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Report Pending</h2>
          <p className="text-sm text-[#6B6862] max-w-md mx-auto mb-6 leading-relaxed">
            It takes up to 24 hours for your doctor to prepare your personalized wellness protocol. Please check back soon.
          </p>
          <Link
            href="/user/menu/support"
            className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#E7E2D9] hover:border-[#C8996A] px-5 py-2.5 rounded-full text-xs font-semibold text-[#1A1A1A] transition"
          >
            <QuestionMarkCircleIcon className="w-4 h-4 text-[#C8996A]" />
            Contact Support
          </Link>
        </div>
      )}

      {/* Doctor Summary / Notes */}
      {notes && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C827A]">
            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-[#C8996A]" />
            Doctor's Summary & Observations
          </div>
          <div className="bg-white border border-[#E7E2D9] border-l-4 border-l-[#C8996A] rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-[#353535] leading-relaxed italic font-normal">
              "{notes}"
            </p>
          </div>
        </div>
      )}

      {/* Wellness Recommendations */}
      {recommendations && Object.keys(recommendations).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C827A]">
            <SparklesIcon className="w-4 h-4 text-[#C8996A]" />
            Personalized Protocol & Recommendations
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(recommendations).map(([category, rec]) => {
              if (!rec) return null;
              const selectedOption = rec.selectedOption || rec.selected_option || '';
              const categoryNotes = rec.notes || '';

              if (!selectedOption && !categoryNotes) return null;

              return (
                <div
                  key={category}
                  className="bg-white border border-[#E7E2D9] rounded-2xl p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#1A1A1A] capitalize">
                      {category}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-[#C8996A]" />
                  </div>

                  {selectedOption && (
                    <div className="flex items-start gap-2 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl p-3">
                      <CheckCircleIcon className="w-4 h-4 text-[#C8996A] flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold text-[#1A1A1A] leading-snug">
                        {selectedOption}
                      </p>
                    </div>
                  )}

                  {categoryNotes && (
                    <p className="text-xs text-[#6B6862] leading-relaxed">
                      {categoryNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Products */}
      {storeRecommendations && storeRecommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8C827A]">
              <ShoppingBagIcon className="w-4 h-4 text-[#C8996A]" />
              Recommended Formulations & Products
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/user/cart"
                className="inline-flex items-center gap-1.5 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
              >
                <ShoppingBagIcon className="w-3.5 h-3.5" />
                GO TO CART
              </Link>
              <Link
                href="/user/store"
                className="text-xs font-semibold text-[#C8996A] hover:text-[#1A1A1A] inline-flex items-center gap-1 transition"
              >
                Browse Store <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {storeRecommendations.map((item, idx) => {
              const productName = item.product_name || item.productName || 'Ayurvedic Formula';
              const size = item.size || '';
              const quantity = item.quantity || item.qty || 1;
              const productId = item.product_id || item.productId || null;
              const itemId = generateCartItemId(productName, size, productId);
              const isInCart = Boolean(
                cartItemsMap[itemId] ||
                cartItemsMap[`${productName}_${size}`] ||
                (item.item_id && cartItemsMap[item.item_id])
              );

              return (
                <div
                  key={idx}
                  className="bg-white border border-[#E7E2D9] rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-center flex-shrink-0">
                      <ShoppingBagIcon className="w-5 h-5 text-[#C8996A]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#1A1A1A] truncate">
                        {productName}
                      </h4>
                      {size && (
                        <p className="text-xs text-[#8C827A] mt-0.5">
                          Size: {size}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isInCart ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                        In Cart
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C8996A] hover:text-[#1A1A1A] bg-[#FAF8F5] hover:bg-[#FFD3AC] border border-[#E7E2D9] px-2.5 py-1 rounded-full transition cursor-pointer"
                      >
                        + Add to Cart
                      </button>
                    )}
                    <span className="px-3 py-1 rounded-full bg-[#FFD3AC]/40 text-xs font-bold text-[#1A1A1A]">
                      x{quantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Specialist Referral */}
      {referral && (
        <div className="bg-[#FAF8F5] border border-[#C8996A]/50 rounded-2xl p-6 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#FFD3AC] flex items-center justify-center flex-shrink-0 mt-0.5">
            <UserIcon className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C827A]">
              Specialist Referral
            </h4>
            <p className="text-sm font-semibold text-[#1A1A1A] mt-1">
              {referral.referred_to_doctor_name
                ? `Referral to Dr. ${referral.referred_to_doctor_name}`
                : referral.referred_specialty_label
                ? `Referral for ${referral.referred_specialty_label}`
                : 'Specialist Referral Recommended'}
            </p>
            {referral.notes && (
              <p className="text-xs text-[#6B6862] mt-1.5 leading-relaxed">
                {referral.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}