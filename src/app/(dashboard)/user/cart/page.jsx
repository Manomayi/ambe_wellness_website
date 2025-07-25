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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {totalQuantity === 0 ? 'No Items' : `${totalQuantity} Item${totalQuantity > 1 ? 's' : ''}`}
          </h1>
        </div>

        {/* Cart Items or Empty Message */}
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-900 font-medium">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-gray-100 border border-green-300 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{item.productName || item.product_name}</h3>
                  {item.doctor_recommended && (
                    <span className="text-green-600 text-xs font-bold">RECOMMENDED</span>
                  )}
                </div>
                <p className="text-gray-900 font-medium mb-3">
                  Size: {item.size || item.variantName || 'Standard'} - MRP: ${item.mrp || item.price || 0}
                </p>
                <div className="flex items-center justify-between">
                  <div className="bg-green-500 rounded-full flex items-center">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="p-2 text-white disabled:opacity-50"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <span className="px-4 text-white font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 text-white"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="h-6 w-6" />
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
              className="text-green-500 font-medium hover:underline"
            >
              ADD DOCTOR RECOMMENDATIONS
            </button>
          </div>
        )}

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Estimated Order Summary</h2>
            <div className="bg-gray-100 border border-green-300 rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Subtotal</span>
                  <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Tax</span>
                  <span className="text-gray-900 font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Shipping</span>
                  <span className="text-gray-900 font-medium">${shipping.toFixed(2)}</span>
                </div>
                {subscriptionDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">Subscription Discount</span>
                    <span className="text-green-700 font-medium">-${subscriptionDiscount.toFixed(2)}</span>
                  </div>
                )}
                {referralDiscount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-green-700 font-medium">
                        {referralInfo.isFirstTimeReferred 
                          ? "Referral Discount (25%)" 
                          : "Referral Credit (25%)"}
                      </span>
                      <span className="text-green-700 font-medium">-${referralDiscount.toFixed(2)}</span>
                    </div>
                    {referralInfo.credits > 0 && !referralInfo.isFirstTimeReferred && (
                      <div className="text-center">
                        <span className="text-xs text-gray-700 font-medium">
                          ({referralInfo.credits} credit{referralInfo.credits > 1 ? 's' : ''} available)
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
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
              className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition"
            >
              CHECKOUT
            </button>
          </div>
        )}

        {/* Doctor Recommendations Modal */}
        {showRecommendationsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4 text-center text-gray-900">Doctor Recommendations</h3>
              <div className="space-y-3 mb-6">
                {doctorRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{rec.product_name}</p>
                    <p className="text-sm text-gray-700 font-medium">
                      Size: {rec.size}, Quantity: {rec.quantity}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRecommendationsModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addDoctorRecommendations}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
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