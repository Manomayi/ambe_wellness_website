'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  addDoc,
  serverTimestamp,
  onSnapshot,
  where,
  doc,
  setDoc,
} from 'firebase/firestore';
import { decideRefund } from '@/lib/refundPolicy';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import {
  TruckIcon,
  ClockIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ReceiptRefundIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import ProductDetailsModal from '@/components/user/store/ProductDetailsModal';
import { fetchProductForModal } from '@/lib/shop/productModalHelper';

// Helper to add business days (excluding Saturday & Sunday)
function addBusinessDays(startDate, days) {
  const current = new Date(startDate);
  let added = 0;
  while (added < days) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return current;
}

// Generate formatted ship date or 3-4 business day window
function getShipDateString(orderDate, explicitShipDate) {
  if (explicitShipDate) {
    const d = explicitShipDate.toDate ? explicitShipDate.toDate() : new Date(explicitShipDate);
    return `Shipped on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }
  const start = addBusinessDays(orderDate, 3);
  const end = addBusinessDays(orderDate, 4);
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [purchasesRaw, setPurchasesRaw] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Product Details Modal state
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  // Refund Modal state
  const [selectedRefundItem, setSelectedRefundItem] = useState(null);
  const [refundPatientMessage, setRefundPatientMessage] = useState('Refund Deposit Request');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);
  const [refundError, setRefundError] = useState('');

  const handleOpenProductDetails = async (item) => {
    try {
      const prod = await fetchProductForModal(
        item.product_id || item.productId || item.item_id || item.id,
        item.name || item.product_name || item.productName,
        item
      );
      setSelectedProductForModal(prod);
    } catch (e) {
      console.error('Error opening product details:', e);
    }
  };

  useEffect(() => {
    let unsubs = [];
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      const uid = user.uid;

      // 1. Listen to purchases collection
      const purchasesQ = query(collection(db, 'users', uid, 'purchases'));
      const unsubPurchases = onSnapshot(
        purchasesQ,
        (snap) => {
          setPurchasesRaw(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (err) => {
          console.error('Failed to load purchases:', err);
          setLoading(false);
        }
      );

      // 2. Listen to consultations
      const consultQ = query(collection(db, 'consultations'), where('user_id', '==', uid));
      const unsubConsult = onSnapshot(
        consultQ,
        (snap) => {
          setConsultations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => {
          if (err?.code !== 'permission-denied') {
            console.error('Failed to load consultations:', err);
          }
        }
      );

      // 3. Listen to refundRequests
      const refundQ = query(collection(db, 'refundRequests'), where('userId', '==', uid));
      const unsubRefund = onSnapshot(
        refundQ,
        (snap) => {
          setRefundRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => {
          if (err?.code !== 'permission-denied') {
            console.error('Failed to load refund requests:', err);
          }
        }
      );

      unsubs = [unsubPurchases, unsubConsult, unsubRefund];
    });

    return () => {
      unsubAuth();
      unsubs.forEach((u) => u && u());
    };
  }, [router]);

  const purchases = useMemo(() => {
    const parseDate = (val) => {
      if (!val) return null;
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
      if (val.toDate) return val.toDate();
      if (typeof val === 'number') return new Date(val > 100000000000 ? val : val * 1000);
      if (val.seconds) return new Date(val.seconds * 1000);
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    // Index refunds
    const refundsMap = {};
    refundRequests.forEach((r) => {
      if (r.id) refundsMap[r.id] = r;
      if (r.consultationId && r.consultationId !== 'N/A') refundsMap[r.consultationId] = r;
      if (r.paymentId && r.paymentId !== 'N/A') refundsMap[r.paymentId] = r;
    });

    // Index consultations
    const consultationsMap = {};
    consultations.forEach((c) => {
      if (c.id) consultationsMap[c.id] = c;
      if (c.appointment_id) consultationsMap[c.appointment_id] = c;
      if (c.consultation_id) consultationsMap[c.consultation_id] = c;
      if (c.payment_id) consultationsMap[c.payment_id] = c;
      if (c.payment_intent_id) consultationsMap[c.payment_intent_id] = c;
    });

    const now = new Date();

    const items = purchasesRaw.map((data) => {
      const orderType = data.type || 'store';
      const rawTime = data.created_at || data.createdAt || data.created || data.timestamp;
      const date = parseDate(rawTime) || new Date();

      const rawAmount = data.amount ?? 0;
      const amountNum = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
      const displayAmount =
        amountNum >= 100 && Number.isInteger(amountNum) && !data.amount_is_dollars
          ? (amountNum / 100).toFixed(2)
          : amountNum.toFixed(2);

      let productStatus =
        data.product_status ||
        data.fulfillment_status ||
        data.order_status ||
        data.status;

      let declineReason = (data.decline_reason || data.declineReason || '').trim();

      const consultationId = data.consultation_id || data.appointment_id || null;
      const paymentIntentId = data.payment_intent_id || data.payment_id || null;

      let refundReq = null;
      let consultDoc = null;
      let refundEligibility = null;

      if (orderType === 'consultation' || orderType === 'consultation_deposit') {
        // Match consultation document
        if (consultationId && consultationsMap[consultationId]) {
          consultDoc = consultationsMap[consultationId];
        } else if (paymentIntentId && consultationsMap[paymentIntentId]) {
          consultDoc = consultationsMap[paymentIntentId];
        } else if (consultationsMap[data.id]) {
          consultDoc = consultationsMap[data.id];
        }

        // Match refund request
        if (consultationId && refundsMap[consultationId]) {
          refundReq = refundsMap[consultationId];
        } else if (paymentIntentId && refundsMap[paymentIntentId]) {
          refundReq = refundsMap[paymentIntentId];
        } else if (refundsMap[data.id]) {
          refundReq = refundsMap[data.id];
        }

        if (refundReq) {
          const reqStatus = (refundReq.status || '').toLowerCase();
          if (
            reqStatus === 'waiting_for_approval' ||
            reqStatus === 'waitingforapproval' ||
            reqStatus === 'requested'
          ) {
            productStatus = 'Waiting for Approval';
          } else if (reqStatus === 'approved') {
            productStatus = 'Approved';
          } else if (reqStatus === 'declined') {
            productStatus = 'Refund Declined';
            if (refundReq.declineReason) {
              declineReason = refundReq.declineReason.trim();
            }
          } else if (reqStatus === 'refunded') {
            const is50 = refundReq.refundableAmount === 25 || refundReq.isNoShow === true;
            productStatus = is50 ? 'Refunded (50%)' : 'Refunded';
          }
        } else {
          // No refund request, calculate eligibility
          const apptTime = consultDoc
            ? parseDate(consultDoc.time || consultDoc.scheduled_at)
            : null;
          const userJoined = consultDoc?.user_joined === true;
          const doctorJoined = consultDoc?.doctor_joined === true;
          const cStatus = consultDoc?.status || null;
          const callStatus = consultDoc?.call_status || null;
          const callEndedAt = consultDoc ? parseDate(consultDoc.call_ended_at) : null;

          const decision = decideRefund({
            nowMs: now.getTime(),
            appointmentTimeMs: apptTime ? apptTime.getTime() : null,
            cancelledAtMs: consultDoc ? parseDate(consultDoc.cancelled_at)?.getTime() || null : null,
            userJoined,
            doctorJoined,
            status: cStatus,
            callStatus,
            callEndedAtMs: callEndedAt ? callEndedAt.getTime() : null,
            paymentDateMs: date ? date.getTime() : null,
            depositAmount: 50.0,
          });

          const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          const isWithin30Days = diffDays <= 30;
          const isUpcoming = decision.isUpcoming;
          const canRequestRefund = isWithin30Days && !isUpcoming;

          refundEligibility = {
            ...decision,
            isWithin30Days,
            canRequestRefund,
            consultDoc,
            consultationDate: apptTime,
            doctorName: consultDoc?.doctor_name || 'Assigned Doctor',
          };

          const rawRefundStatus = (data.refund_status || '').toLowerCase();
          if (
            rawRefundStatus === 'waiting_for_approval' ||
            rawRefundStatus === 'waitingforapproval' ||
            rawRefundStatus === 'requested'
          ) {
            productStatus = 'Waiting for Approval';
          } else if (
            rawRefundStatus === 'declined' ||
            (productStatus && productStatus.toLowerCase().includes('decline'))
          ) {
            productStatus = 'Refund Declined';
          } else if (rawRefundStatus === 'refunded' || rawRefundStatus === 'approved') {
            const is50 = data.refund_percentage === 50 || Number(data.refund_amount) === 25;
            productStatus = is50 ? 'Refunded (50%)' : 'Refunded';
          } else if (isUpcoming) {
            productStatus = 'Upcoming';
          } else if (
            !productStatus ||
            ['succeeded', 'paid', 'success'].includes(productStatus.toLowerCase())
          ) {
            productStatus = 'Success';
          }
        }
      } else if (orderType === 'store') {
        if (!productStatus || productStatus.toLowerCase() === 'succeeded') {
          productStatus = 'Processing';
        }
      } else {
        const rawRefundStatus = (data.refund_status || '').toLowerCase();
        if (
          rawRefundStatus === 'declined' ||
          (productStatus && productStatus.toLowerCase().includes('decline'))
        ) {
          productStatus = 'Refund Declined';
        } else if (rawRefundStatus === 'refunded' || rawRefundStatus === 'approved') {
          productStatus = 'Refunded';
        } else if (!productStatus || productStatus.toLowerCase() === 'succeeded') {
          productStatus = 'Paid';
        }
      }

      return {
        id: data.id,
        amount: displayAmount,
        currency: (data.currency || 'USD').toUpperCase(),
        status: productStatus,
        declineReason: declineReason,
        paymentStatus: data.status || 'succeeded',
        type: orderType,
        description: data.description || '',
        items: Array.isArray(data.items) ? data.items : [],
        time: date,
        shipDate: data.ship_date || data.shipped_at || null,
        trackingNumber: data.tracking_number || data.trackingNumber || '',
        consultationId,
        paymentIntentId,
        refundReq,
        refundEligibility,
        consultDoc,
      };
    });

    items.sort((a, b) => b.time - a.time);
    return items;
  }, [purchasesRaw, consultations, refundRequests]);

  const openReviewModal = (item) => {
    setReviewingProduct(item);
    setRating(0);
    setHoverRating(0);
    setReviewText('');
    setReviewError('');
    setReviewSuccess(false);
  };

  const closeReviewModal = () => {
    setReviewingProduct(null);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating) {
      setReviewError('Please select a star rating.');
      return;
    }
    if (!currentUser || !reviewingProduct) return;

    setSubmittingReview(true);
    setReviewError('');

    try {
      await addDoc(collection(db, 'reviews'), {
        targetType: 'product',
        targetId: reviewingProduct.product_id || reviewingProduct.productId || reviewingProduct.item_id || reviewingProduct.id || (reviewingProduct.shop_id ? `${reviewingProduct.shop_id}_${reviewingProduct.product_name || reviewingProduct.name}` : (reviewingProduct.product_name || reviewingProduct.name || 'Product')),
        shopId: reviewingProduct.shop_id || reviewingProduct.shopId || null,
        productName: reviewingProduct.product_name || reviewingProduct.name || 'Product',
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        userPhoto: currentUser.photoURL || null,
        rating,
        review: reviewText.trim(),
        createdAt: serverTimestamp(),
      });

      setReviewSuccess(true);
      setTimeout(() => {
        closeReviewModal();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-b-2 border-[#FFD3AC] rounded-full" />
      </div>
    );
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'subscription':
      case 'consultation':
      case 'consultation_deposit':
        return 'Consultation Deposit';
      case 'store':
      default:
        return 'Product Order';
    }
  };

  const getStatusBadgeColor = (statusStr) => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('decline')) {
      return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
    }
    if (s.includes('waiting') || s.includes('approval') || s.includes('request')) {
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
    if (s.includes('refund')) {
      return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    }
    if (s === 'delivered' || s === 'paid' || s === 'succeeded' || s === 'success') {
      return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    }
    if (s === 'shipped') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    if (s === 'upcoming') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
  };

  const handleOpenRefundModal = (item) => {
    setSelectedRefundItem(item);
    setRefundPatientMessage('Refund Deposit Request');
    setRefundError('');
    setRefundSuccess(false);
  };

  const closeRefundModal = () => {
    setSelectedRefundItem(null);
  };

  const handleSubmitRefund = async (e) => {
    e.preventDefault();
    if (!currentUser || !selectedRefundItem) return;
    if (!refundPatientMessage.trim()) {
      setRefundError('Please enter a message or reason for the refund.');
      return;
    }

    setSubmittingRefund(true);
    setRefundError('');

    try {
      const eligibility = selectedRefundItem.refundEligibility;
      const targetConsultationId =
        selectedRefundItem.consultationId ||
        selectedRefundItem.paymentIntentId ||
        selectedRefundItem.id;
      const paymentId =
        selectedRefundItem.paymentIntentId ||
        targetConsultationId;

      const consultationDateStr = eligibility?.consultationDate
        ? eligibility.consultationDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : 'N/A';

      const doctorName = eligibility?.doctorName || 'Assigned Doctor';
      const formattedDoctor =
        doctorName && !doctorName.toLowerCase().startsWith('dr.') && !doctorName.toLowerCase().startsWith('dr ')
          ? `Dr. ${doctorName}`
          : doctorName;

      const refPayload = {
        id: targetConsultationId,
        userId: currentUser.uid,
        user_id: currentUser.uid,
        userName: currentUser.displayName || 'Patient',
        userEmail: currentUser.email || '',
        paymentId: paymentId,
        payment_id: paymentId,
        consultationId: targetConsultationId,
        consultation_id: targetConsultationId,
        doctorName: formattedDoctor,
        doctor_name: formattedDoctor,
        consultationDate: consultationDateStr,
        depositAmount: 50.0,
        refundableAmount: eligibility?.refundableAmount ?? 50.0,
        isNoShow: eligibility?.isNoShow ?? false,
        refundPolicy: eligibility?.policyText || 'Full deposit refund eligible.',
        status: 'waiting_for_approval',
        patientMessage: refundPatientMessage.trim(),
        receiptUrl: null,
        receiptStoragePath: null,
        declineReason: null,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        auditTrail: [
          {
            status: 'waiting_for_approval',
            changedBy: currentUser.uid,
            role: 'patient',
            timestamp: new Date().toISOString(),
            note: 'Refund request submitted by patient from purchase history',
          },
        ],
      };

      // 1. Update/set consultation record
      await setDoc(
        doc(db, 'consultations', targetConsultationId),
        {
          refund_status: 'waiting_for_approval',
          refundable_amount: eligibility?.refundableAmount ?? 50.0,
          patient_message: refundPatientMessage.trim(),
          refund_submitted_at: serverTimestamp(),
          is_no_show: eligibility?.isNoShow ?? false,
        },
        { merge: true }
      );

      // 2. Set refundRequests record
      await setDoc(doc(db, 'refundRequests', targetConsultationId), refPayload, { merge: true });

      // 3. Update purchase document under users/{uid}/purchases
      if (selectedRefundItem.id) {
        await setDoc(
          doc(db, 'users', currentUser.uid, 'purchases', selectedRefundItem.id),
          {
            refund_status: 'waiting_for_approval',
          },
          { merge: true }
        );
      }

      setRefundSuccess(true);
      setTimeout(() => {
        closeRefundModal();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit refund request:', err);
      setRefundError(err.message || 'Failed to submit refund request. Please try again.');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const now = new Date();

  return (
    <WebLayoutWrapper>
      <div className="space-y-6 pb-24">
        {/* Sticky Top Header */}
        <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <AmbeBackButton onClick={() => router.push('/user/menu')} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
              Purchase History
            </h1>
          </div>
        </div>

        {purchases.length === 0 ? (
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-12 text-center shadow-xl backdrop-blur-md">
            <p className="text-sm text-white/60">No purchases found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchaseItem) => {
              const {
                id,
                amount,
                currency,
                status,
                type,
                description,
                items,
                time,
                shipDate,
                trackingNumber,
                declineReason,
                refundReq,
                refundEligibility,
              } = purchaseItem;
              const diffMs = now - time;
              const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const canReview = daysElapsed >= 14;
              const daysRemaining = Math.max(1, 14 - daysElapsed);
              const shipDateStr = getShipDateString(time, shipDate);

              return (
                <div
                  key={id}
                  className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md p-6 hover:border-white/20 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FFD3AC] bg-white/10 px-3 py-1 rounded-full border border-white/10">
                        {getTypeLabel(type)}
                      </span>
                      <div className="mt-2.5 space-y-1 text-xs text-white/70">
                        <p>
                          <strong className="text-white">{type === 'store' ? 'Order Date:' : 'Date:'}</strong>{' '}
                          {time.toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                        {type === 'store' && (
                          <>
                            <p>
                              <strong className="text-white">Ship Date:</strong> {shipDateStr}
                            </p>
                            {trackingNumber && (
                              <p>
                                <strong className="text-white">Tracking Number:</strong>{' '}
                                <span className="text-[#FFD3AC] font-mono select-all bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                  {trackingNumber}
                                </span>
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-xl font-bold text-white">
                        ${amount} <span className="text-xs font-semibold text-white/60">{currency}</span>
                      </p>
                      <span
                        className={`inline-block mt-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadgeColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {status === 'Refund Declined' && declineReason && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-200">
                      <strong className="text-rose-300">Decline Reason:</strong> {declineReason}
                    </div>
                  )}

                  {/* Shipping notice banner for store orders */}
                  {type === 'store' && status?.toLowerCase() !== 'shipped' && status?.toLowerCase() !== 'delivered' && (
                    <div className="flex items-start gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/80">
                      <TruckIcon className="w-4 h-4 text-[#FFD3AC] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        Order will ship within 3-4 business days. Often times much faster.
                      </span>
                    </div>
                  )}

                  {description && (
                    <p className="text-sm text-white/80">{description}</p>
                  )}

                  {items && items.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#FFD3AC] mb-2.5">
                        Items ({items.length}):
                      </p>
                      <div className="space-y-2">
                        {items.map((item, idx) => {
                          const productName = item.name || item.product_name || item.productName || 'Product';
                          const qty = item.quantity || 1;
                          const price = Number(item.price) || 0;
                          const hasProduct = Boolean(item.product_id || item.productId || item.item_id || item.id || item.product_name || item.name);

                          const rawSize = (item.size || item.variantName || item.pack_size || '').toString().trim();
                          const hasMultipleSizes = Boolean(
                            item.has_multiple_sizes ||
                            item.hasMultipleSizes ||
                            (rawSize && !['standard', 'default', 'n/a', 'none', '1', 'regular'].includes(rawSize.toLowerCase()))
                          );
                          const sizeDisplay = (hasMultipleSizes && rawSize) ? ` (${rawSize})` : '';

                          return (
                            <div
                              key={idx}
                              onClick={() => handleOpenProductDetails(item)}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFD3AC]/40 transition text-xs cursor-pointer group"
                              title="Click to view product details"
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-semibold text-white group-hover:text-[#FFD3AC] transition inline-flex items-center gap-1.5">
                                    <span>
                                      {productName}
                                      {sizeDisplay} × {qty}
                                    </span>
                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-white/40 group-hover:text-[#FFD3AC] opacity-0 group-hover:opacity-100 transition shrink-0" />
                                  </span>
                                  <span className="ml-2 font-medium text-white/60">
                                    ${(price * qty).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Delayed review button / tag */}
                              {type === 'store' && hasProduct && (
                                <div
                                  className="flex items-center sm:justify-end"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {canReview ? (
                                    <button
                                      type="button"
                                      onClick={() => openReviewModal(item)}
                                      className="px-3.5 py-1 text-xs font-bold rounded-full bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe0c4] transition cursor-pointer shadow-sm"
                                    >
                                      Write Review
                                    </button>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/10 text-white/60 cursor-help"
                                      title={`Reviews open 2 weeks after order to give you time to experience the product (${daysRemaining} day${
                                        daysRemaining === 1 ? '' : 's'
                                      } remaining).`}
                                    >
                                      <ClockIcon className="w-3.5 h-3.5 text-white/60" />
                                      Review in {daysRemaining}d
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Consultation Refund Status Boxes / Action */}
                  {(type === 'consultation' || type === 'consultation_deposit') && (
                    <div className="pt-2 border-t border-white/10 space-y-3">
                      {refundReq ? (
                        <>
                          {refundReq.status === 'waiting_for_approval' && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                                <ClockIcon className="w-4 h-4 shrink-0" />
                                <span>Refund Request Submitted</span>
                              </div>
                              {refundReq.patientMessage && (
                                <p className="text-white/80">
                                  <strong>Reason:</strong> {refundReq.patientMessage}
                                </p>
                              )}
                              <p className="text-white/50 text-[11px]">
                                Submitted & waiting for administrative approval.
                              </p>
                            </div>
                          )}

                          {refundReq.status === 'approved' && (
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-200">
                              <div className="flex items-center gap-1.5 font-bold text-blue-300">
                                <CheckCircleIcon className="w-4 h-4 shrink-0" />
                                <span>Approved / Processing Refund</span>
                              </div>
                              {refundReq.patientMessage && (
                                <p className="text-white/80 mt-1">
                                  <strong>Reason:</strong> {refundReq.patientMessage}
                                </p>
                              )}
                            </div>
                          )}

                          {refundReq.status === 'declined' && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-200">
                              <strong className="text-rose-300">Decline Reason:</strong> {declineReason || refundReq.declineReason || 'No reason provided.'}
                            </div>
                          )}

                          {refundReq.status === 'refunded' && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-200 flex items-center gap-2">
                              <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>Refund Completed (${(refundReq.refundableAmount ?? 50).toFixed(2)})</span>
                            </div>
                          )}
                        </>
                      ) : refundEligibility ? (
                        <>
                          {refundEligibility.canRequestRefund ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-3.5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-white">
                                    Calculated Refund:
                                  </span>
                                  <span className="text-sm font-bold text-[#FFD3AC]">
                                    ${refundEligibility.refundableAmount.toFixed(2)} ({refundEligibility.isNoShow ? '50%' : 'Full'})
                                  </span>
                                </div>
                                <p className="text-[11px] text-white/60 mt-0.5">
                                  {refundEligibility.policyText}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenRefundModal(purchaseItem)}
                                className="px-4 py-2 text-xs font-bold rounded-full bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe0c4] transition cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                              >
                                <ReceiptRefundIcon className="w-4 h-4" />
                                <span>
                                  {refundEligibility.isNoShow ? 'Request 50% Refund ($25.00)' : 'Request Full Refund ($50.00)'}
                                </span>
                              </button>
                            </div>
                          ) : refundEligibility.isUpcoming ? (
                            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200">
                              <ClockIcon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <span>Refund locked until the consultation ends or is cancelled.</span>
                            </div>
                          ) : !refundEligibility.isWithin30Days ? (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-200">
                              Refund period expired (exceeded 30 days).
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Review Modal */}
        {reviewingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-[#2D2D30] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/15 relative animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={closeReviewModal}
                className="absolute top-4 right-4 p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                aria-label="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold text-white mb-1">
                Review {reviewingProduct.product_name || reviewingProduct.name || 'Product'}
              </h2>
              <p className="text-xs text-white/60 mb-5">
                Share your honest feedback to help our doctors and community.
              </p>

              {reviewSuccess ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <p className="font-semibold text-white">Thank you for your review!</p>
                  <p className="text-xs text-white/60">Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  {reviewError && (
                    <div className="p-2.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium border border-red-500/30">
                      {reviewError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-2">
                      Rating <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-1.5 items-center">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating || rating) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 focus:outline-none cursor-pointer"
                          >
                            {active ? (
                              <StarIconSolid className="w-7 h-7 text-[#FFD3AC]" />
                            ) : (
                              <StarIconOutline className="w-7 h-7 text-white/30" />
                            )}
                          </button>
                        );
                      })}
                      <span className="ml-2 text-xs font-medium text-white/70">
                        {rating ? `${rating} of 5 stars` : 'Select stars'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white/80 mb-1.5">
                      Your Review
                    </label>
                    <textarea
                      rows={4}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="How did this product work for you? Describe your experience..."
                      className="w-full text-xs p-3 rounded-xl border border-white/15 bg-white/5 focus:outline-none focus:border-[#FFD3AC] text-white placeholder:text-white/40 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={closeReviewModal}
                      className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2.5 text-xs font-bold rounded-full bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe0c4] transition disabled:opacity-50 cursor-pointer shadow-md"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Refund Request Modal */}
        {selectedRefundItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#2D2D30] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white/15 space-y-5 my-auto text-white">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Request Consultation Refund
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Order #{selectedRefundItem.id}
                  </p>
                </div>
                <button
                  onClick={closeRefundModal}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                  aria-label="Close"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {refundSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl font-bold">
                    <CheckCircleIcon className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    Refund Request Submitted!
                  </h4>
                  <p className="text-xs text-white/70 max-w-xs mx-auto">
                    Your request has been submitted and is waiting for administrator approval.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRefund} className="space-y-4">
                  {/* Refund Amount Card */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#FFD3AC]">
                      Refundable Amount
                    </span>
                    <p className="text-3xl font-extrabold text-[#FFD3AC]">
                      ${(selectedRefundItem.refundEligibility?.refundableAmount ?? 50.0).toFixed(2)} USD
                    </p>
                    <p className="text-xs text-white/70 flex items-center space-x-1.5">
                      <InformationCircleIcon className="w-4 h-4 text-[#FFD3AC] shrink-0" />
                      <span>
                        {selectedRefundItem.refundEligibility?.policyText || 'Full deposit refund eligible.'}
                      </span>
                    </p>
                  </div>

                  {/* Consultation / Payment Details */}
                  <div className="text-xs text-white/80 space-y-1.5 bg-black/20 p-4 rounded-xl border border-white/10">
                    <p>
                      <span className="font-semibold text-white">Doctor:</span>{' '}
                      {selectedRefundItem.refundEligibility?.doctorName || 'Assigned Doctor'}
                    </p>
                    {selectedRefundItem.refundEligibility?.consultationDate && (
                      <p>
                        <span className="font-semibold text-white">Consultation Date:</span>{' '}
                        {selectedRefundItem.refundEligibility.consultationDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-white">Deposit Paid:</span> $
                      {(Number(selectedRefundItem.amount) || 50.0).toFixed(2)} {selectedRefundItem.currency || 'USD'}
                    </p>
                    <p>
                      <span className="font-semibold text-white">Order Date:</span>{' '}
                      {selectedRefundItem.time.toLocaleDateString()}
                    </p>
                  </div>

                  {/* Patient Message / Reason */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/80">
                      Message / Reason *
                    </label>
                    <textarea
                      rows={3}
                      value={refundPatientMessage}
                      onChange={(e) => setRefundPatientMessage(e.target.value)}
                      placeholder="Explain the reason for your refund request..."
                      className="w-full p-3 text-xs border border-white/15 bg-white/5 rounded-xl focus:border-[#FFD3AC] text-white placeholder:text-white/40 focus:outline-none resize-none"
                    />
                  </div>

                  {refundError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                      <span>{refundError}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={closeRefundModal}
                      className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white rounded-full transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRefund}
                      className="px-6 py-2.5 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full text-xs font-bold uppercase tracking-wider transition disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      {submittingRefund ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {selectedProductForModal && (
          <ProductDetailsModal
            product={selectedProductForModal}
            onClose={() => setSelectedProductForModal(null)}
          />
        )}
      </div>
    </WebLayoutWrapper>
  );
}
