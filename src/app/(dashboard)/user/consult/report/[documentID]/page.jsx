'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { generateCartItemId } from '@/lib/cartUtils';
import { format } from 'date-fns';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
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
    const unsubCart = onSnapshot(
      collection(db, 'users', currentUser.uid, 'cart'),
      (snap) => {
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
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to cart items:', err);
      }
    );
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#FFD3AC] rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <WebLayoutWrapper>
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-4 pt-2">
            <AmbeBackButton onClick={() => router.push('/user/consult')} />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Your Report
            </h1>
          </div>
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-12 text-center shadow-xl backdrop-blur-md">
            <DocumentTextIcon className="h-16 w-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Report Found</h2>
            <p className="text-sm text-white/60 mb-6">
              We couldn't locate a completed report for this consultation.
            </p>
            <button
              onClick={() => router.push('/user/consult')}
              className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-6 py-2.5 rounded-full text-sm font-bold transition cursor-pointer"
            >
              Return to Consultations
            </button>
          </div>
        </div>
      </WebLayoutWrapper>
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
    <WebLayoutWrapper>
      <div className="space-y-6 pb-24">
        {/* App Bar / Back */}
        <div className="flex items-center gap-4 pt-2">
          <AmbeBackButton onClick={() => router.push('/user/consult')} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
            Your Report
          </h1>
        </div>

        {/* Header Banner Card */}
        <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-7 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${statusInfo.dotClass}`} />
                  {statusInfo.label}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {statusInfo.isCancelled
                  ? 'Cancelled Consultation'
                  : statusInfo.isMissed
                  ? (statusInfo.statusKey === 'doctor_absent' ? 'Doctor Absent' : 'Missed Consultation')
                  : 'Consultation Report'}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {statusInfo.isCancelled
                  ? 'This scheduled consultation was cancelled.'
                  : statusInfo.isMissed
                  ? (statusInfo.statusKey === 'doctor_absent'
                      ? 'The assigned doctor was absent for the scheduled video session.'
                      : 'This scheduled video consultation was not attended.')
                  : 'Personalized wellness protocol and treatment guidance.'}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 bg-white/5 border border-white/10 rounded-xl p-4 shrink-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <UserIcon className="w-4 h-4 text-[#FFD3AC]" />
                Dr. {doctorName}
              </div>
              {formattedDate && (
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <CalendarDaysIcon className="w-4 h-4 text-[#FFD3AC]/70" />
                  {formattedDate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cancelled Consultation View */}
        {statusInfo.isCancelled && (
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 sm:p-12 text-center backdrop-blur-md shadow-xl">
            <XCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Consultation Cancelled</h2>
            <p className="text-sm text-white/70 max-w-lg mx-auto mb-6 leading-relaxed">
              {statusInfo.statusKey === 'cancelled_by_doctor'
                ? 'This consultation was cancelled by the healthcare provider. You are eligible for a 100% full refund on your deposit or you may schedule a new consultation with another doctor.'
                : 'This consultation was cancelled by you. No clinical report or wellness protocol is generated for cancelled consultations. If eligible under our cancellation policy, you can view and claim your deposit refund in the Refunds section.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/user/menu/refunds"
                style={{ color: '#1E1E1E' }}
                className="inline-flex items-center gap-2 bg-[#FFD3AC] hover:bg-[#ffe0c4] !text-[#1E1E1E] px-5 py-2.5 rounded-full text-xs font-bold transition shadow-md"
              >
                <InformationCircleIcon className="w-4 h-4 !text-[#1E1E1E]" />
                <span className="!text-[#1E1E1E] font-bold">View Refund Status</span>
              </Link>
              <Link
                href="/user/consult/schedule"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/15 hover:border-[#FFD3AC] px-5 py-2.5 rounded-full text-xs font-bold text-white transition"
              >
                <CalendarDaysIcon className="w-4 h-4 text-[#FFD3AC]" />
                Book New Consultation
              </Link>
            </div>
          </div>
        )}

        {/* Missed Consultation View */}
        {statusInfo.isMissed && (
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 sm:p-12 text-center backdrop-blur-md shadow-xl">
            <ClockIcon className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              {statusInfo.statusKey === 'doctor_absent' ? 'Doctor Absent' : 'Missed Consultation'}
            </h2>
            <p className="text-sm text-white/70 max-w-lg mx-auto mb-6 leading-relaxed">
              {statusInfo.statusKey === 'doctor_absent'
                ? 'Your assigned doctor was unable to attend the scheduled video consultation. Under our policy, you are entitled to a 100% full refund of your deposit, or you can reschedule at your convenience.'
                : 'This video consultation was missed because the session was not attended. As per our missed consultation policy, no personalized wellness protocol is generated, and you are eligible for a 50% deposit refund ($25.00 USD).'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/user/menu/refunds"
                style={{ color: '#1E1E1E' }}
                className="inline-flex items-center gap-2 bg-[#FFD3AC] hover:bg-[#ffe0c4] !text-[#1E1E1E] px-5 py-2.5 rounded-full text-xs font-bold transition shadow-md"
              >
                <InformationCircleIcon className="w-4 h-4 !text-[#1E1E1E]" />
                <span className="!text-[#1E1E1E] font-bold">Claim 50% Refund</span>
              </Link>
              <Link
                href="/user/consult/schedule"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/15 hover:border-[#FFD3AC] px-5 py-2.5 rounded-full text-xs font-bold text-white transition"
              >
                <CalendarDaysIcon className="w-4 h-4 text-[#FFD3AC]" />
                Schedule Consultation
              </Link>
            </div>
          </div>
        )}

        {/* If completed but doctor hasn't submitted details yet */}
        {statusInfo.isCompleted && !hasReportContent && (
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 sm:p-12 text-center backdrop-blur-md shadow-xl">
            <ClockIcon className="h-16 w-16 text-[#FFD3AC] mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-white mb-2">Report Pending</h2>
            <p className="text-sm text-white/70 max-w-md mx-auto mb-6 leading-relaxed">
              It takes up to 24 hours for your doctor to prepare your personalized wellness protocol. Please check back soon.
            </p>
            <Link
              href="/user/menu/support"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/15 hover:border-[#FFD3AC] px-5 py-2.5 rounded-full text-xs font-bold text-white transition"
            >
              <QuestionMarkCircleIcon className="w-4 h-4 text-[#FFD3AC]" />
              Contact Support
            </Link>
          </div>
        )}

        {/* Doctor Summary / Notes */}
        {notes && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFD3AC] px-1">
              <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-[#FFD3AC]" />
              Doctor's Summary & Observations
            </div>
            <div className="bg-[#2D2D30]/85 border border-white/10 border-l-4 border-l-[#FFD3AC] rounded-2xl p-6 backdrop-blur-md shadow-xl">
              <p className="text-sm text-white/90 leading-relaxed italic font-normal">
                "{notes}"
              </p>
            </div>
          </div>
        )}

        {/* Wellness Recommendations */}
        {recommendations && Object.keys(recommendations).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFD3AC] px-1">
              <SparklesIcon className="w-4 h-4 text-[#FFD3AC]" />
              Recommendations
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(recommendations).map(([category, rec]) => {
                if (!rec) return null;
                const normalizedKey = category.toLowerCase().replace(/[^a-z0-9]/g, '');
                if ([
                  'useruid',
                  'userid',
                  'uid',
                  'appointmentid',
                  'doctoruid',
                  'doctorid',
                  'historyid',
                  'documentid',
                  'createdat',
                  'updatedat',
                  'timestamp',
                  'referral',
                ].includes(normalizedKey)) return null;

                const selectedOption = rec.selectedOption || rec.selected_option || '';
                const categoryNotes = rec.notes || '';

                if (!selectedOption && !categoryNotes) return null;

                return (
                  <div
                    key={category}
                    className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white capitalize">
                        {category}
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-[#FFD3AC]" />
                    </div>

                    {selectedOption && (
                      <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                        <CheckCircleIcon className="w-4 h-4 text-[#FFD3AC] shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-white leading-snug">
                          {selectedOption}
                        </p>
                      </div>
                    )}

                    {categoryNotes && (
                      <p className="text-xs text-white/70 leading-relaxed">
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
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFD3AC]">
                <ShoppingBagIcon className="w-4 h-4 text-[#FFD3AC]" />
                Recommended Products
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/user/cart"
                  className="inline-flex items-center gap-1.5 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-sm"
                >
                  <ShoppingBagIcon className="w-3.5 h-3.5" />
                  GO TO CART
                </Link>
                <Link
                  href="/user/store"
                  className="text-xs font-semibold text-[#FFD3AC] hover:text-white inline-flex items-center gap-1 transition"
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
                    className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <ShoppingBagIcon className="w-5 h-5 text-[#FFD3AC]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-white truncate">
                          {productName}
                        </h4>
                        {size && (
                          <p className="text-xs text-white/60 mt-0.5">
                            Size: {size}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isInCart ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                          In Cart
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E1E1E] bg-[#FFD3AC] hover:bg-[#ffe0c4] px-2.5 py-1 rounded-full transition cursor-pointer"
                        >
                          + Add to Cart
                        </button>
                      )}
                      <span className="px-3 py-1 rounded-full bg-[#FFD3AC] text-xs font-bold text-[#1E1E1E]">
                        x{quantity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Go to cart full button */}
            <div className="pt-2">
              <button
                onClick={() => router.push('/user/cart')}
                className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] font-bold py-4 rounded-full transition flex items-center justify-center gap-2 shadow-lg cursor-pointer text-sm uppercase tracking-wider"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                GO TO CART
              </button>
            </div>
          </div>
        )}

        {/* Specialist Referral */}
        {referral && (
          <div className="bg-[#2D2D30]/85 border border-[#FFD3AC]/40 rounded-2xl p-6 backdrop-blur-md shadow-xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#FFD3AC] flex items-center justify-center shrink-0 mt-0.5">
              <UserIcon className="w-5 h-5 text-[#1E1E1E]" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFD3AC]">
                Specialist Referral
              </h4>
              <p className="text-sm font-semibold text-white mt-1">
                {referral.referred_to_doctor_name
                  ? `Referral to Dr. ${referral.referred_to_doctor_name}`
                  : referral.referred_specialty_label
                  ? `Referral for ${referral.referred_specialty_label}`
                  : 'Specialist Referral Recommended'}
              </p>
              {referral.notes && (
                <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
                  {referral.notes}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </WebLayoutWrapper>
  );
}