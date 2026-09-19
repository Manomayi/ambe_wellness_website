'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, addDoc, serverTimestamp } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
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
        const items = snap.docs.map(doc => {
          const data = doc.data();
          const ts = data.created;
          const date = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts < 10000000000 ? ts * 1000 : ts) : new Date());
          const rawAmount = data.amount ?? 0;
          const amountNum = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount) || 0;
          // If stored in cents (e.g. 5000), format to 50.00
          const displayAmount = amountNum >= 100 && Number.isInteger(amountNum) && !data.amount_is_dollars
            ? (amountNum / 100).toFixed(2)
            : amountNum.toFixed(2);

          const orderType = data.type || 'store';
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-2 border-[#C8996A] border-t-transparent rounded-full" />
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
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    }
    if (s === 'shipped') return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const now = new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton />
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Purchase History</h1>

      {purchases.length === 0 ? (
        <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 text-center shadow-sm">
          <p className="text-sm text-[#6B6862]">No purchases found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map(({ id, amount, currency, status, type, description, items, time, shipDate }) => {
            const diffMs = now - time;
            const daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const canReview = daysElapsed >= 14;
            const daysRemaining = Math.max(1, 14 - daysElapsed);
            const shipDateStr = getShipDateString(time, shipDate);

            return (
              <div
                key={id}
                className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E7E2D9] gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C8996A] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E7E2D9]">
                      {getTypeLabel(type)}
                    </span>
                    <div className="mt-2 space-y-0.5 text-xs text-[#6B6862]">
                      <p>
                        <strong className="text-[#353535]">Order Date:</strong>{' '}
                        {time.toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      {type === 'store' && (
                        <p>
                          <strong className="text-[#353535]">Ship Date:</strong> {shipDateStr}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xl font-bold text-[#1A1A1A]">
                      ${amount} <span className="text-xs font-semibold text-[#8C827A]">{currency}</span>
                    </p>
                    <span
                      className={`inline-block mt-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded border ${getStatusBadgeColor(
                        status
                      )}`}
                    >
                      Status: {status}
                    </span>
                  </div>
                </div>

                {/* Shipping notice banner for store orders */}
                {type === 'store' && (
                  <div className="mt-3.5 flex items-start gap-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-lg p-3 text-xs text-[#524B45]">
                    <TruckIcon className="w-4 h-4 text-[#C8996A] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      Order will ship within 3-4 business days. Often times much faster.
                    </span>
                  </div>
                )}

                {description && (
                  <p className="text-sm text-[#353535] mt-3">{description}</p>
                )}

                {items && items.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E7E2D9]/60">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#8C827A] mb-2.5">
                      Items ({items.length}):
                    </p>
                    <div className="space-y-2">
                      {items.map((item, idx) => {
                        const productName = item.name || item.product_name || item.productName || 'Product';
                        const qty = item.quantity || 1;
                        const price = Number(item.price) || 0;
                        const hasProduct = Boolean(item.product_id || item.productId || item.item_id || item.id || item.product_name || item.name);

                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#FAF8F5]/50 border border-[#E7E2D9]/40 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="font-medium text-[#1A1A1A]">
                                  {productName}
                                  {item.size ? ` (${item.size})` : ''} × {qty}
                                </span>
                                <span className="ml-2 font-medium text-[#8C827A]">
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
                                    className="px-3 py-1 text-xs font-semibold rounded-full bg-[#FFD3AC]/40 text-[#1A1A1A] hover:bg-[#FFD3AC] transition border border-[#C8996A]/30"
                                  >
                                    Write Review
                                  </button>
                                ) : (
                                  <span
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EAE5DE]/60 text-[#7A746B] cursor-help"
                                    title={`Reviews open 2 weeks after order to give you time to experience the product (${daysRemaining} day${
                                      daysRemaining === 1 ? '' : 's'
                                    } remaining).`}
                                  >
                                    <ClockIcon className="w-3.5 h-3.5 text-[#8C827A]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E7E2D9] relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 p-1.5 text-[#8C827A] hover:text-[#1A1A1A] rounded-full hover:bg-[#FAF8F5] transition"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#1A1A1A] mb-1">
              Review {reviewingProduct.product_name || reviewingProduct.name || 'Product'}
            </h2>
            <p className="text-xs text-[#8C827A] mb-5">
              Share your honest feedback to help our doctors and community.
            </p>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <p className="font-semibold text-[#1A1A1A]">Thank you for your review!</p>
                <p className="text-xs text-[#6B6862]">Your feedback has been submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {reviewError && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#353535] mb-2">
                    Rating <span className="text-red-500">*</span>
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
                          className="p-1 focus:outline-hidden"
                        >
                          {active ? (
                            <StarIconSolid className="w-7 h-7 text-[#C8996A]" />
                          ) : (
                            <StarIconOutline className="w-7 h-7 text-[#D4CFC7]" />
                          )}
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs font-medium text-[#6B6862]">
                      {rating ? `${rating} of 5 stars` : 'Select stars'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#353535] mb-1.5">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="How did this product work for you? Describe your experience..."
                    className="w-full text-xs p-3 rounded-lg border border-[#E7E2D9] focus:outline-hidden focus:border-[#C8996A] text-[#1A1A1A] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeReviewModal}
                    className="px-4 py-2 text-xs font-semibold text-[#6B6862] hover:text-[#1A1A1A] rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#ffc897] transition disabled:opacity-50"
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
  );
}
