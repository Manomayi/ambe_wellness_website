"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  query,
  where,
  increment,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import { getItemUnitPrice } from '@/lib/cartUtils';
import { 
  TrashIcon, 
  MinusIcon, 
  PlusIcon,
  ShoppingCartIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import ProductDetailsModal from '@/components/user/store/ProductDetailsModal';
import { fetchProductForModal } from '@/lib/shop/productModalHelper';

export default function UserCartPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState(null);
  const [referralInfo, setReferralInfo] = useState({
    credits: 0,
    isFirstTimeReferred: false,
    hasReferrer: false,
    hasMadePurchase: false
  });
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [transitioningToCheckout, setTransitioningToCheckout] = useState(false);

  const handleOpenProductDetails = async (item) => {
    try {
      const prod = await fetchProductForModal(
        item.productId || item.product_id || item.id,
        item.productName || item.product_name,
        item
      );
      setSelectedProductForModal(prod);
    } catch (e) {
      console.error('Error opening product details:', e);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Reconcile completed referrals
    const reconcileReferrals = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        // 1. If this user registered with a referral code, ensure referred_by is linked
        if (!userData.referred_by && userData.referral_code_used) {
          const code = String(userData.referral_code_used).trim().toUpperCase();
          const refQuery = query(collection(db, 'users'), where('referral_code', '==', code), limit(1));
          const refSnap = await getDocs(refQuery);
          if (!refSnap.empty && refSnap.docs[0].id !== user.uid) {
            const referrerId = refSnap.docs[0].id;
            await updateDoc(userDocRef, {
              referred_by: referrerId,
              has_made_purchase: userData.has_made_purchase || false
            }).catch(() => {});
            userData.referred_by = referrerId;
          }
        }

        // 2. Find all users that this user has referred
        const q = query(collection(db, 'users'), where('referred_by', '==', user.uid));
        const snap = await getDocs(q);

        let validReferredFriendsCount = 0;
        for (const friendDoc of snap.docs) {
          const friendData = friendDoc.data();
          let hasPurchased = friendData.has_made_purchase === true || friendData.referral_status === 'completed';
          if (!hasPurchased) {
            const purchasesSnap = await getDocs(collection(db, 'users', friendDoc.id, 'purchases'));
            if (!purchasesSnap.empty) {
              hasPurchased = true;
              await updateDoc(doc(db, 'users', friendDoc.id), {
                has_made_purchase: true,
                referral_reward_granted: true,
                referral_status: 'completed'
              }).catch(() => {});
            }
          }
          if (hasPurchased) {
            validReferredFriendsCount++;
          }
        }

        // 2. Determine credits spent by this user
        const spentOrders = Array.isArray(userData.referral_credit_orders) ? userData.referral_credit_orders : [];
        let spentCount = spentOrders.length;
        
        // Also check if user has placed purchases that used credits
        const myPurchasesSnap = await getDocs(collection(db, 'users', user.uid, 'purchases'));
        if (myPurchasesSnap.size > spentCount && !userData.referred_by) {
          spentCount = Math.min(validReferredFriendsCount, myPurchasesSnap.size);
        }

        const exactCreditsAvailable = Math.max(0, validReferredFriendsCount - spentCount);

        if (userData.referral_count !== validReferredFriendsCount || userData.referral_credits !== exactCreditsAvailable) {
          await updateDoc(userDocRef, {
            referral_count: validReferredFriendsCount,
            referral_credits: exactCreditsAvailable
          }).catch(() => {});
        }
      } catch (err) {
        console.error('Error reconciling referrals:', err);
      }
    };
    reconcileReferrals();

    // Listen to cart items
    const cartQuery = query(collection(db, 'users', user.uid, 'cart'));
    
    const unsubscribeCart = onSnapshot(
      cartQuery,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCartItems(items);
        setLoading(false);
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to cart:', err);
        setLoading(false);
      }
    );

    // Listen to user subscription and referral info
    const unsubscribeUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          setUserSubscription(userData.subscription);
          setReferralInfo({
            credits: userData.referral_credits || 0,
            hasReferrer: !!userData.referred_by,
            hasMadePurchase: userData.has_made_purchase || false,
            isFirstTimeReferred: !!userData.referred_by && !userData.has_made_purchase
          });
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to user profile:', err);
      }
    );

    return () => {
      unsubscribeCart();
      unsubscribeUser();
    };
  }, [user]);

  const getTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + getItemUnitPrice(item) * (item.quantity || 1), 0);
  };

  const getTax = (subtotal) => {
    return subtotal * 0.10; // 10% tax
  };

  const getShipping = () => {
    return 10.0; // Fixed shipping
  };

  const getSubscriptionDiscount = () => {
    return userSubscription?.active ? 50.0 : 0;
  };

  const getReferralDiscount = (subtotal) => {
    if (referralInfo.isFirstTimeReferred || referralInfo.credits > 0) {
      return subtotal * 0.20; // 20% discount
    }
    return 0;
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    // 1. Instant optimistic UI update for 0ms delay on Safari / mobile
    setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));

    try {
      await updateDoc(doc(db, 'users', user.uid, 'cart', itemId), {
        quantity: newQuantity
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    // 1. Instant optimistic removal from UI
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0 || transitioningToCheckout) return;
    setTransitioningToCheckout(true);
    router.push('/user/checkout');
  };

  const totalQuantity = getTotalQuantity();
  const subtotal = getSubtotal();
  const shipping = getShipping();
  const subscriptionDiscount = getSubscriptionDiscount();
  const referralDiscount = getReferralDiscount(subtotal);
  const totalDiscount = subscriptionDiscount + referralDiscount;
  const total = subtotal + shipping - totalDiscount;

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-36">
          {/* Sticky Header */}
          <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm flex items-center gap-4">
            <AmbeBackButton onClick={() => router.push('/user/store')} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
              {totalQuantity === 0 ? 'No Items' : `${totalQuantity} Item${totalQuantity > 1 ? 's' : ''}`}
            </h1>
          </div>

          {/* Cart Items or Empty Message */}
          {cartItems.length === 0 ? (
            <div className="text-center py-16 bg-[#2D2D30]/85 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md">
              <ShoppingCartIcon className="w-16 h-16 text-white/30 mx-auto mb-3" />
              <p className="text-lg text-white font-semibold mb-1">Your cart is empty</p>
              <p className="text-xs text-white/60 mb-6">Explore our Ayurvedic store to add products to your cart.</p>
              <button
                onClick={() => router.push('/user/store')}
                className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Browse Store
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => {
                const unitPrice = getItemUnitPrice(item);
                const mrp = Number(item.mrp) || 0;
                const hasDiscount = item.price != null && Number(item.price) > 0 && mrp > unitPrice;

                return (
                  <div
                    key={item.id}
                    className={`bg-[#2D2D30]/85 border ${
                      item.doctor_recommended ? 'border-[#FFD3AC]/40' : 'border-white/10'
                    } rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-3 transition`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3
                        onClick={() => handleOpenProductDetails(item)}
                        className="font-bold text-base text-white leading-snug hover:text-[#FFD3AC] transition cursor-pointer inline-flex items-center gap-1.5 group"
                        title="Click to view product details"
                      >
                        <span>{item.productName || item.product_name}</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-white/40 group-hover:text-[#FFD3AC] opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </h3>
                      {item.doctor_recommended && (
                        <span className="bg-[#FFD3AC] text-[#1E1E1E] text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                          PRESCRIPTION
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-white/70">
                      {Boolean(
                        (item.has_multiple_sizes ||
                          (item.size && !['standard', 'default', 'n/a', 'none', '1', 'regular'].includes(item.size.trim().toLowerCase()))) &&
                        item.size &&
                        item.size.trim()
                      ) && (
                        <>
                          <span>Size: {item.size}</span>
                          <span className="text-white/30">•</span>
                        </>
                      )}
                      <span className="font-semibold text-white">Price: ${unitPrice.toFixed(2)}</span>
                      {hasDiscount && (
                        <span className="text-white/40 line-through">${mrp.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity pill control */}
                      <div className="bg-[#FFD3AC] rounded-full flex items-center px-1.5 py-0.5 shadow-md">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          disabled={(item.quantity || 1) <= 1}
                          className="p-1.5 text-[#1E1E1E] disabled:opacity-30 cursor-pointer active:scale-75 transition-transform"
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                        <span className="px-3 text-[#1E1E1E] font-bold text-sm min-w-[20px] text-center select-none">
                          {item.quantity || 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          className="p-1.5 text-[#1E1E1E] cursor-pointer active:scale-75 transition-transform"
                          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                          aria-label="Increase quantity"
                        >
                          <PlusIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Remove item button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-300 p-2 transition cursor-pointer"
                        aria-label="Remove item"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Order Summary */}
          {cartItems.length > 0 && (
            <div className="mt-8 space-y-3">
              <h2 className="text-base font-bold text-white px-1">
                Estimated Order Summary
              </h2>
              <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-white/70">Subtotal</span>
                    <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-white/70">Tax</span>
                    <span className="text-[#FFD3AC] font-medium">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-white/70">Shipping</span>
                    <span className="text-white font-medium">${shipping.toFixed(2)}</span>
                  </div>
                  {subscriptionDiscount > 0 && (
                    <div className="flex justify-between text-xs sm:text-sm text-[#FFD3AC]">
                      <span>Subscription Discount</span>
                      <span>-${subscriptionDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {referralDiscount > 0 && (
                    <>
                      <div className="flex justify-between text-xs sm:text-sm text-[#FFD3AC]">
                        <span>
                          {referralInfo.isFirstTimeReferred 
                            ? "Referral Discount (20%)" 
                            : "Referral Credit (20%)"}
                        </span>
                        <span>-${referralDiscount.toFixed(2)}</span>
                      </div>
                      {referralInfo.credits > 0 && !referralInfo.isFirstTimeReferred && (
                        <div className="text-center">
                          <span className="text-[11px] text-white/50">
                            ({referralInfo.credits} credit{referralInfo.credits > 1 ? 's' : ''} available)
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="border-t border-white/10 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm sm:text-base">Total</span>
                      <span className="text-[#FFD3AC] font-bold text-lg sm:text-xl">${total.toFixed(2)}</span>
                    </div>
                    <div className="text-right text-[11px] text-white/50 pt-1">
                      *Taxes calculated at checkout based on destination
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={transitioningToCheckout || cartItems.length === 0}
                  className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] active:scale-[0.98] text-[#1E1E1E] font-bold py-4 rounded-full transition-all uppercase tracking-wider shadow-lg text-sm cursor-pointer disabled:opacity-80 flex items-center justify-center gap-2"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  {transitioningToCheckout ? (
                    <>
                      <div className="w-5 h-5 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                      <span>PROCEEDING TO CHECKOUT...</span>
                    </>
                  ) : (
                    <span>CHECKOUT</span>
                  )}
                </button>
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
    </ProtectedRoute>
  );
}