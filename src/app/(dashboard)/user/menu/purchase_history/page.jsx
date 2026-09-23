'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, addDoc, serverTimestamp } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import { TruckIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

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
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [reviewingProduct, setReviewingProduct] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      try {
        const uid = user.uid;
        const q = query(collection(db, 'users', uid, 'purchases'));
        const snap = await getDocs(q);

        const parseDate = (val) => {
          if (!val) return new Date();
          if (val.toDate) return val.toDate();
          if (typeof val === 'number') {
            return new Date(val < 10000000000 ? val * 1000 : val);
          }
          const parsed = new Date(val);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        };

        const items = snap.docs.map(doc => {
          const data = doc.data();
          const orderType = data.type || 'store';
          const rawTime = data.created_at || data.createdAt || data.created || data.timestamp;
          const date = parseDate(rawTime);

          const rawAmount = data.amount ?? 0;
          const amountNum = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
          // If stored in cents (e.g. 5000), format to 50.00
          const displayAmount = amountNum >= 100 && Number.isInteger(amountNum) && !data.amount_is_dollars
            ? (amountNum / 100).toFixed(2)
            : amountNum.toFixed(2);

          let productStatus =
            data.product_status ||
            data.fulfillment_status ||
            data.order_status ||
            data.status;

          if (orderType === 'consultation' || orderType === 'consultation_deposit') {
            if (
              !productStatus ||
              ['succeeded', 'paid', 'success'].includes(productStatus.toLowerCase())
            ) {
              productStatus = 'Success';
            }
          } else if (orderType === 'store') {
            if (!productStatus || productStatus.toLowerCase() === 'succeeded') {
              productStatus = 'Processing';
            }
          } else {
            if (!productStatus || productStatus.toLowerCase() === 'succeeded') {
              productStatus = 'Paid';
            }
          }

          return {
            id: doc.id,
            amount: displayAmount,
            currency: (data.currency || 'USD').toUpperCase(),
            status: productStatus,
            paymentStatus: data.status || 'succeeded',
            type: orderType,
            description: data.description || '',
            items: Array.isArray(data.items) ? data.items : [],
            time: date,
            shipDate: data.ship_date || data.shipped_at || null,
            trackingNumber: data.tracking_number || data.trackingNumber || '',
            consultationId: data.consultation_id || data.appointment_id || null,
            paymentIntentId: data.payment_intent_id || data.payment_id || null,
          };
        });
        // Sort newest first
        items.sort((a, b) => b.time - a.time);
        setPurchases(items);
      } catch (e) {
        console.error('Failed to load purchases:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

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
    if (s === 'delivered' || s === 'paid' || s === 'succeeded' || s === 'success') {
      return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    }
    if (s === 'shipped') return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
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
            {purchases.map(({ id, amount, currency, status, type, description, items, time, shipDate, trackingNumber }) => {
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
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-semibold text-white">
                                    {productName}
                                    {sizeDisplay} × {qty}
                                  </span>
                                  <span className="ml-2 font-medium text-white/60">
                                    ${(price * qty).toFixed(2)}
                                  </span>
                                </div>
                              </div>

                              {/* Delayed review button / tag */}
                              {type === 'store' && hasProduct && (
                                <div className="flex items-center sm:justify-end">
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
      </div>
    </WebLayoutWrapper>
  );
}
