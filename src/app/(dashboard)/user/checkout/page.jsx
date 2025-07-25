"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  addDoc,
  getDocs,
  query
} from 'firebase/firestore';
import { db, functions } from '@/lib/firebase/config';
import { httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function UserCheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    streetNumber: '',
    streetName: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA'
  });

  // Order calculation values
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(10);
  const [subscriptionDiscount, setMembershipDiscount] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [referralCreditsToUse, setReferralCreditsToUse] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to user data
    const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserData(data);
        
        // Set delivery address
        if (data.delivery_address) {
          const addr = data.delivery_address;
          setDeliveryAddress(
            `${addr.streetNumber} ${addr.streetName}, ${addr.city}, ${addr.state}, ${addr.zipCode}, ${addr.country}`
          );
          setAddressForm(addr);
        }
      }
    });

    // Listen to cart items
    const unsubscribeCart = onSnapshot(
      collection(db, 'users', user.uid, 'cart'),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCartItems(items);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeCart();
    };
  }, [user]);

  // Calculate order totals whenever cart items or user data changes
  useEffect(() => {
    if (!userData || !cartItems) return;

    // Calculate subtotal
    const sub = cartItems.reduce((sum, item) => {
      return sum + ((item.mrp || item.price || 0) * item.quantity);
    }, 0);
    setSubtotal(sub);

    // Calculate tax (10%)
    const calculatedTax = sub * 0.10;
    setTax(calculatedTax);

    // Set shipping (fixed $10 if cart has items)
    setShipping(sub > 0 ? 10 : 0);

    // Calculate Subscription Discount
    const isSubscribed = userData.subscription?.active || false;
    setMembershipDiscount(isSubscribed ? 50 : 0);

    // Calculate referral discount
    const referralCredits = userData.referral_credits || 0;
    const isFirstTimeReferred = userData.referred_by && !userData.has_made_purchase;
    
    let refDiscount = 0;
    let creditsToUse = 0;
    
    if (isFirstTimeReferred) {
      refDiscount = sub * 0.25; // 25% off first purchase
      creditsToUse = 0;
    } else if (referralCredits > 0) {
      refDiscount = sub * 0.25; // 25% off using one credit
      creditsToUse = 1;
    }
    
    setReferralDiscount(refDiscount);
    setReferralCreditsToUse(creditsToUse);

    // Calculate total
    const totalAmount = sub + calculatedTax + shipping - subscriptionDiscount - refDiscount;
    setTotal(Math.max(0, totalAmount));
  }, [userData, cartItems]);

  const updateDeliveryAddress = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        delivery_address: addressForm
      });
      setShowAddressModal(false);
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    }
  };

  const handlePlaceOrder = async () => {
    // Validate delivery address
    if (!deliveryAddress.trim()) {
      alert('Please add a delivery address before placing an order.');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setProcessing(true);

    try {
      // Prepare cart data for checkout
      const checkoutItems = cartItems.map(item => ({
        name: item.productName || item.product_name || 'Product',
        price: item.mrp || item.price || 0,
        quantity: item.quantity || 1
      }));

      console.log('Sending to checkout:', {
        items: checkoutItems,
        total: total,
        email: user.email
      });

      // Create payment intent via Cloud Function (matching Flutter implementation)
      const createPaymentIntentStore = httpsCallable(functions, 'createPaymentIntentStore');
      const result = await createPaymentIntentStore({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        type: 'store',
        referral_credits_to_use: referralCreditsToUse
      });

      console.log('Cloud function response:', result.data);

      if (!result.data) {
        throw new Error('No response from payment service');
      }

      const { clientSecret, paymentIntentId } = result.data;

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Store payment intent ID for monitoring
      sessionStorage.setItem('paymentIntentId', paymentIntentId);
      
      // Redirect to Stripe payment page
      router.push(`/user/checkout/payment?client_secret=${clientSecret}&payment_intent=${paymentIntentId}`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to process checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

        {/* Delivery Address Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Delivery Address</h2>
          <div className="bg-gray-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 font-medium">
                {deliveryAddress || 'No address provided'}
              </p>
              <button
                onClick={() => setShowAddressModal(true)}
                className="text-green-600 font-medium hover:underline"
              >
                {deliveryAddress ? 'UPDATE' : 'ADD'}
              </button>
            </div>
          </div>
        </div>

        {/* Subscription Status Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Subscription Status</h2>
          <div className="bg-gray-100 border border-green-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-900 font-medium">
                {userData?.subscription?.active ? 'Active' : 'Inactive'}
              </p>
              {!userData?.subscription?.active && (
                <button
                  onClick={() => router.push('/user/payment')}
                  className="text-green-600 font-medium hover:underline"
                >
                  SUBSCRIBE
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Order Summary</h2>
          <div className="bg-gray-100 border border-green-300 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-900">Subtotal</span>
                <span className="text-gray-900 font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {subscriptionDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-900">Subscription Discount</span>
                  <span className="text-green-600 font-medium">-${subscriptionDiscount.toFixed(2)}</span>
                </div>
              )}
              
              {referralDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-900">
                    {userData?.referred_by && !userData?.has_made_purchase
                      ? 'First Purchase Referral Discount (25%)'
                      : `Referral Discount (25% - ${(userData?.referral_credits || 0) - 1} left)`}
                  </span>
                  <span className="text-green-600 font-medium">-${referralDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-900">Tax</span>
                <span className="text-gray-900 font-medium">${tax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-900">Shipping</span>
                <span className="text-gray-900 font-medium">${shipping.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={processing || cartItems.length === 0}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {processing ? 'Processing...' : 'PLACE ORDER'}
        </button>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {deliveryAddress ? 'Update Address' : 'Add Address'}
              </h3>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Street Number"
                    value={addressForm.streetNumber}
                    onChange={(e) => setAddressForm({...addressForm, streetNumber: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="Street Name"
                    value={addressForm.streetName}
                    onChange={(e) => setAddressForm({...addressForm, streetName: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={updateDeliveryAddress}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}