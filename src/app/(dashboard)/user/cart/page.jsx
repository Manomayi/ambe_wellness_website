"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  query,
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
import { 
  TrashIcon, 
  MinusIcon, 
  PlusIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function UserCartPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorRecommendations, setDoctorRecommendations] = useState([]);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [referralInfo, setReferralInfo] = useState({
    credits: 0,
    isFirstTimeReferred: false,
    hasReferrer: false,
    hasMadePurchase: false
  });

  useEffect(() => {
    if (!user) return;

    // Listen to cart items
    const cartQuery = query(collection(db, 'users', user.uid, 'cart'));
    
    const unsubscribeCart = onSnapshot(cartQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCartItems(items);
      setLoading(false);
    });

    // Listen to user subscription and referral info
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
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
    });

    // Load doctor recommendations
    loadDoctorRecommendations();

    return () => {
      unsubscribeCart();
      unsubscribeUser();
    };
  }, [user]);

  const loadDoctorRecommendations = async () => {
    try {
      const profileQuery = query(
        collection(db, 'users', user.uid, 'profile'),
        orderBy('time', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(profileQuery);
      
      if (!snapshot.empty) {
        const profileData = snapshot.docs[0].data();
        setDoctorRecommendations(profileData.store_recommendations || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.mrp || item.price || 0) * item.quantity, 0);
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
      return subtotal * 0.25; // 25% discount
    }
    return 0;
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'cart', itemId), {
        quantity: newQuantity
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cart', itemId));
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const addDoctorRecommendations = async () => {
    try {
      for (const recommendation of doctorRecommendations) {
        await addDoc(collection(db, 'users', user.uid, 'cart'), {
          doctor_recommended: true,
          item_id: '',
          product_name: recommendation.product_name,
          productName: recommendation.product_name,
          quantity: recommendation.quantity,
          size: recommendation.size,
          mrp: 0.0, // This should be fetched from product data
          price: 0.0
        });
      }
      setShowRecommendationsModal(false);
      alert('Doctor recommendations added to cart');
    } catch (error) {
      console.error('Error adding recommendations:', error);
    }
  };

  const handleCheckout = () => {
    router.push('/user/checkout');
  };

  const totalQuantity = getTotalQuantity();
  const subtotal = getSubtotal();
  const tax = getTax(subtotal);
  const shipping = getShipping();
  const subscriptionDiscount = getSubscriptionDiscount();
  const referralDiscount = getReferralDiscount(subtotal);
  const totalDiscount = subscriptionDiscount + referralDiscount;
  const total = subtotal + tax + shipping - totalDiscount;

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8996A] border-t-transparent"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {totalQuantity === 0 ? 'No Items' : `${totalQuantity} Item${totalQuantity > 1 ? 's' : ''}`}
          </h1>
        </div>

        {/* Cart Items or Empty Message */}
        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#E7E2D9] rounded-xl">
            <p className="text-xl text-[#1A1A1A] font-medium">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-[#1A1A1A]">{item.productName || item.product_name}</h3>
                  {item.doctor_recommended && (
                    <span className="text-[#C8996A] text-xs font-bold uppercase tracking-wider">RECOMMENDED</span>
                  )}
                </div>
                <p className="text-[#1A1A1A] font-medium text-sm mb-3">
                  Size: {item.size || item.variantName || 'Standard'} - MRP: ${item.mrp || item.price || 0}
                </p>
                <div className="flex items-center justify-between">
                  <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-full flex items-center">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-2 text-[#1A1A1A] disabled:opacity-40"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-[#1A1A1A] font-medium text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-[#1A1A1A]"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-[#8C827A] hover:text-red-600 transition"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Doctor Recommendations Button */}
        {doctorRecommendations.length > 0 && (
          <div className="text-center py-4">
            <button
              onClick={() => setShowRecommendationsModal(true)}
              className="text-[#C8996A] font-medium hover:underline text-sm uppercase tracking-wider"
            >
              ADD DOCTOR RECOMMENDATIONS
            </button>
          </div>
        )}

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4 text-[#1A1A1A]">Estimated Order Summary</h2>
            <div className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#6B6862] font-medium text-sm">Subtotal</span>
                  <span className="text-[#1A1A1A] font-medium text-sm">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6862] font-medium text-sm">Tax</span>
                  <span className="text-[#1A1A1A] font-medium text-sm">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B6862] font-medium text-sm">Shipping</span>
                  <span className="text-[#1A1A1A] font-medium text-sm">${shipping.toFixed(2)}</span>
                </div>
                {subscriptionDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[#C8996A] font-medium text-sm">Subscription Discount</span>
                    <span className="text-[#C8996A] font-medium text-sm">-${subscriptionDiscount.toFixed(2)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#C8996A] font-medium text-sm">
                        {referralInfo.isFirstTimeReferred 
                          ? "Referral Discount (25%)" 
                          : "Referral Credit (25%)"}
                      </span>
                      <span className="text-[#C8996A] font-medium text-sm">-${referralDiscount.toFixed(2)}</span>
                    </div>
                    {referralInfo.credits > 0 && !referralInfo.isFirstTimeReferred && (
                      <div className="text-center">
                        <span className="text-xs text-[#8C827A] font-medium">
                          ({referralInfo.credits} credit{referralInfo.credits > 1 ? 's' : ''} available)
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-[#E7E2D9] pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-[#1A1A1A] text-base">Total</span>
                    <span className="text-[#1A1A1A] text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        {cartItems.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleCheckout}
              className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 rounded-lg font-medium text-base transition uppercase tracking-wider shadow-sm"
            >
              CHECKOUT
            </button>
          </div>
        )}

        {/* Doctor Recommendations Modal */}
        {showRecommendationsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full border border-[#E7E2D9]">
              <h3 className="text-xl font-bold mb-4 text-center text-[#1A1A1A]">Doctor Recommendations</h3>
              <div className="space-y-3 mb-6">
                {doctorRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-[#FAF8F5] border border-[#E7E2D9] rounded-lg">
                    <p className="font-medium text-[#1A1A1A] text-sm">{rec.product_name}</p>
                    <p className="text-sm text-[#6B6862]">
                      Size: {rec.size}, Quantity: {rec.quantity}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecommendationsModal(false)}
                  className="flex-1 py-3 border border-[#E7E2D9] rounded-lg hover:bg-[#FAF8F5] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={addDoctorRecommendations}
                  className="flex-1 py-3 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white rounded-lg text-sm font-medium transition"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}