"use client";

import { useState, useEffect, useRef } from 'react';
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
import PaymentMethodSelector from '@/components/common/PaymentMethodSelector';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRemotePaymentConfig } from '@/lib/remoteConfig';
import { startPayPalCheckout } from '@/lib/paypal';
import { getItemUnitPrice } from '@/lib/cartUtils';
import { calculateOrderTax } from '@/lib/taxService';

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
  const [taxRate, setTaxRate] = useState(0.10);
  const [taxMode, setTaxMode] = useState('dynamic');
  const [taxCalculationId, setTaxCalculationId] = useState(null);
  const [isTaxCalculating, setIsTaxCalculating] = useState(false);
  const [shipping, setShipping] = useState(10);
  const [subscriptionDiscount, setMembershipDiscount] = useState(0);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const { isTestMode } = useRemotePaymentConfig();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [referralCreditsToUse, setReferralCreditsToUse] = useState(0);

  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const GOOGLE_PLACES_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 'AIzaSyAAtJdwmMY3CwRUye-9tud_RjUhJ5lDC1A';

  useEffect(() => {
    if (!showAddressModal) return;

    let isSubscribed = true;

    const initAutocomplete = () => {
      if (!isSubscribed || !searchInputRef.current || !window.google?.maps?.places) return;
      if (autocompleteRef.current) return;

      try {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'us' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.address_components) return;

          let streetNumber = '';
          let streetName = '';
          let city = '';
          let state = '';
          let zipCode = '';
          let country = 'USA';

          for (const comp of place.address_components) {
            const types = comp.types;
            if (types.includes('street_number')) {
              streetNumber = comp.long_name;
            } else if (types.includes('route')) {
              streetName = comp.long_name;
            } else if (types.includes('locality')) {
              city = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = comp.short_name || comp.long_name;
            } else if (types.includes('postal_code')) {
              zipCode = comp.long_name;
            } else if (types.includes('country')) {
              country = comp.long_name;
            }
          }

          setAddressForm((prev) => ({
            ...prev,
            streetNumber: streetNumber || prev.streetNumber,
            streetName: streetName || prev.streetName,
            city: city || prev.city,
            state: state || prev.state,
            zipCode: zipCode || prev.zipCode,
            country: country || prev.country || 'USA',
          }));
        });

        autocompleteRef.current = autocomplete;
      } catch (e) {
        console.warn('Could not initialize Google Places autocomplete:', e);
      }
    };

    if (window.google?.maps?.places) {
      setTimeout(initAutocomplete, 100);
    } else {
      const scriptId = 'google-maps-places-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_KEY}&libraries=places`;
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', () => setTimeout(initAutocomplete, 100));
    }

    return () => {
      isSubscribed = false;
      if (autocompleteRef.current) {
        if (window.google?.maps?.event) {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        autocompleteRef.current = null;
      }
    };
  }, [showAddressModal]);


  useEffect(() => {
    if (!user) return;

    // Listen to user data
    const unsubscribeUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserData(data);
          
          // Set delivery address
          if (data.delivery_address) {
            const addr = data.delivery_address;
            const formatted = typeof addr === 'string'
              ? addr
              : `${[addr.streetNumber, addr.streetName].filter(Boolean).join(' ')}, ${addr.city}, ${addr.state}, ${addr.zipCode}, ${addr.country || 'USA'}`;
            setDeliveryAddress(formatted);
            if (typeof addr === 'object') {
              setAddressForm(addr);
            }
          }
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to user data:', err);
      }
    );

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
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to cart items:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeCart();
    };
  }, [user]);

  // Calculate order subtotal, discounts, and shipping whenever cart items or user data changes
  useEffect(() => {
    if (!userData || !cartItems) return;

    // Calculate subtotal
    const sub = cartItems.reduce((sum, item) => {
      return sum + (getItemUnitPrice(item) * (item.quantity || 1));
    }, 0);
    setSubtotal(sub);

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
      refDiscount = sub * 0.20; // 20% off first purchase
      creditsToUse = 0;
    } else if (referralCredits > 0) {
      refDiscount = sub * 0.20; // 20% off using one credit
      creditsToUse = 1;
    }
    
    setReferralDiscount(refDiscount);
    setReferralCreditsToUse(creditsToUse);
  }, [userData, cartItems]);

  // Dynamic or static tax calculation based on delivery jurisdiction
  useEffect(() => {
    if (subtotal <= 0) {
      setTax(0);
      setTaxRate(0);
      return;
    }

    const addr = userData?.delivery_address || addressForm;
    let isMounted = true;
    setIsTaxCalculating(true);

    calculateOrderTax({
      address: addr,
      items: cartItems.map(item => ({
        id: item.id || item.productId,
        name: item.name || '',
        price: getItemUnitPrice(item),
        quantity: item.quantity || 1,
      })),
      subtotal,
      shippingAmount: shipping,
      isTestMode: Boolean(isTestMode),
    }).then(res => {
      if (!isMounted) return;
      setTax(res.taxAmount);
      setTaxRate(res.taxRate);
      setTaxMode(res.mode);
      setTaxCalculationId(res.calculationId);
      setIsTaxCalculating(false);
    }).catch(err => {
      if (!isMounted) return;
      console.warn('Tax calculation error:', err);
      setIsTaxCalculating(false);
    });

    return () => {
      isMounted = false;
    };
  }, [subtotal, shipping, userData?.delivery_address, addressForm?.state, addressForm?.zipCode, isTestMode]);

  // Recalculate grand total
  useEffect(() => {
    const totalAmount = subtotal + tax + shipping - subscriptionDiscount - referralDiscount;
    setTotal(Math.max(0, totalAmount));
  }, [subtotal, tax, shipping, subscriptionDiscount, referralDiscount]);

  const updateDeliveryAddress = async () => {
    if (!addressForm.streetNumber?.trim() && !addressForm.streetName?.trim()) {
      alert('Please enter a street address.');
      return;
    }
    if (!addressForm.city?.trim()) {
      alert('Please enter a city.');
      return;
    }
    if (!addressForm.state?.trim()) {
      alert('Please enter a state.');
      return;
    }
    if (!addressForm.zipCode?.trim()) {
      alert('Please enter a ZIP code.');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        delivery_address: addressForm
      });
      const formatted = `${[addressForm.streetNumber, addressForm.streetName].filter(Boolean).join(' ')}, ${addressForm.city}, ${addressForm.state}, ${addressForm.zipCode}, ${addressForm.country || 'USA'}`;
      setDeliveryAddress(formatted);
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
      setShowAddressModal(true);
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
        tax: tax,
        shipping: shipping,
        email: user.email
      });

      if (paymentMethod === 'paypal') {
        await startPayPalCheckout({
          amountCents: Math.round(total * 100),
          type: 'store',
          referralCreditsToUse: referralCreditsToUse,
          isTestMode: Boolean(isTestMode),
          onSuccess: async () => {
            router.push('/user/checkout/success');
          },
          onError: (err) => {
            console.error('PayPal checkout error:', err);
            alert(err.message || 'PayPal payment could not be completed.');
            setProcessing(false);
          },
          onCancel: () => {
            setProcessing(false);
          },
        });
        return;
      }

      // Create payment intent via Cloud Function (matching Flutter implementation)
      let clientSecret = "";
      let paymentIntentId = "";

      try {
        const createPaymentIntentStore = httpsCallable(functions, 'createPaymentIntentStore');
        const result = await createPaymentIntentStore({
          amount: Math.round(total * 100), // Convert to cents
          currency: 'usd',
          type: 'store',
          referral_credits_to_use: referralCreditsToUse,
          tax_amount: Number(tax.toFixed(2)),
          shipping_amount: Number(shipping.toFixed(2)),
          tax_mode: taxMode,
          tax_rate: taxRate,
          tax_calculation_id: taxCalculationId,
          isTestMode: Boolean(isTestMode),
        });

        console.log('Cloud function response:', result.data);
        if (result.data?.clientSecret) {
          clientSecret = result.data.clientSecret;
          paymentIntentId = result.data.paymentIntentId || "";
        }
      } catch (cfErr) {
        console.warn('createPaymentIntentStore Cloud Function failed, attempting API fallback:', cfErr);
      }

      // Fallback to Next.js API route if Cloud Function did not return clientSecret
      if (!clientSecret) {
        const res = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: "usd",
            type: "store",
            userId: user.uid,
            tax_amount: Number(tax.toFixed(2)),
            shipping_amount: Number(shipping.toFixed(2)),
            tax_mode: taxMode,
            tax_rate: taxRate,
            tax_calculation_id: taxCalculationId,
            description: "Store Product Purchase",
            isTestMode: Boolean(isTestMode),
          }),
        });
        const data = await res.json();
        if (data.clientSecret) {
          clientSecret = data.clientSecret;
          paymentIntentId = data.paymentIntentId || "";
        } else {
          throw new Error(data.error || "Failed to create payment intent");
        }
      }

      // Store payment intent ID and referral credits used for monitoring
      sessionStorage.setItem('paymentIntentId', paymentIntentId);
      sessionStorage.setItem('referralCreditsToUse', String(referralCreditsToUse || 0));
      
      // Redirect to payment page
      router.push(`/user/checkout/payment?client_secret=${clientSecret}&payment_intent=${paymentIntentId}&test_mode=${isTestMode}&method=${paymentMethod}&credits_used=${referralCreditsToUse}`);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to process checkout. Please try again.');
    } finally {
      if (paymentMethod !== 'paypal') {
        setProcessing(false);
      }
    }

  };

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper maxWidth="680px">
        <div className="space-y-6 pb-36">
          <div className="flex items-center gap-3 pt-1">
            <AmbeBackButton href="/user/cart" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Checkout
            </h1>
          </div>

          {/* Delivery Address Section */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 font-sans">
              Delivery Address
            </h2>
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <p className={`text-sm ${deliveryAddress ? 'text-white font-medium' : 'text-white/60'}`}>
                  {deliveryAddress || 'No address provided'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="text-[#FFD3AC] hover:text-[#ffe0c4] active:scale-95 font-semibold text-sm uppercase tracking-wider shrink-0 cursor-pointer transition"
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                >
                  {deliveryAddress ? 'UPDATE' : 'ADD'}
                </button>
              </div>
            </div>
          </div>

          {/* Order Summary Section */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-2.5 font-sans">
              Order Summary
            </h2>
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Subtotal</span>
                <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
              </div>
              
              {subscriptionDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#FFD3AC]">Subscription Discount</span>
                  <span className="text-[#FFD3AC] font-medium">-${subscriptionDiscount.toFixed(2)}</span>
                </div>
              )}
              
              {referralDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#FFD3AC]">
                    {userData?.referred_by && !userData?.has_made_purchase
                      ? 'First Purchase Referral Discount (20%)'
                      : `Referral Discount (20% - ${(userData?.referral_credits || 0) - 1} left)`}
                  </span>
                  <span className="text-[#FFD3AC] font-medium">-${referralDiscount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-white/70">
                  {isTaxCalculating
                    ? 'Tax (Calculating...)'
                    : taxMode === 'static'
                    ? `Tax (${(taxRate * 100).toFixed(0)}% Flat)`
                    : taxRate > 0
                    ? `Tax (${(taxRate * 100).toFixed(2)}%)`
                    : 'Tax'}
                </span>
                <span className="text-white font-medium">
                  {isTaxCalculating ? (
                    <span className="text-xs text-[#FFD3AC] animate-pulse">Calculating...</span>
                  ) : (
                    `$${tax.toFixed(2)}`
                  )}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/70">Shipping</span>
                <span className="text-white font-medium">${shipping.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-xl font-bold text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-md">
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
            isTestMode={isTestMode}
            disabled={processing || isTaxCalculating}
            labelClassName="text-white"
            dark={true}
          />
        </div>

        {/* Place Order Button */}
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={processing || isTaxCalculating || cartItems.length === 0}
          className={`w-full py-4 rounded-xl font-semibold text-base transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md uppercase tracking-wider cursor-pointer active:scale-[0.99] ${
            paymentMethod === 'paypal'
              ? 'bg-[#0070BA] hover:bg-[#003087] text-white'
              : 'bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E]'
          }`}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          {processing
            ? 'Processing...'
            : isTaxCalculating
            ? 'CALCULATING TAX...'
            : paymentMethod === 'paypal'
            ? 'PAY WITH PAYPAL'
            : paymentMethod === 'apple_pay'
            ? 'PROCEED TO APPLE PAY'
            : 'PROCEED TO CARD PAYMENT'}
        </button>


        {/* Address Modal */}
        {showAddressModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddressModal(false);
            }}
          >
            <div className="bg-[#242427] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-xl font-bold text-white mb-2">
                {deliveryAddress ? 'Update Address' : 'Add Address'}
              </h3>
              
              <div className="space-y-3">
                {/* Google Places Search */}
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Search Address (Google Places)
                  </label>
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search street or place to auto-fill..."
                      className="w-full pl-9 pr-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                    />
                    <MagnifyingGlassIcon className="w-4 h-4 text-white/40 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-white/50 mt-1 block">
                    Or enter and edit the address details manually below:
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-0.5">Street Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. 123"
                      value={addressForm.streetNumber}
                      onChange={(e) => setAddressForm({...addressForm, streetNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-0.5">Street Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Main St"
                      value={addressForm.streetName}
                      onChange={(e) => setAddressForm({...addressForm, streetName: e.target.value})}
                      className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] text-white/60 mb-0.5">City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                    className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60 mb-0.5">State *</label>
                    <input
                      type="text"
                      placeholder="State (e.g. TX)"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                      className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60 mb-0.5">ZIP Code *</label>
                    <input
                      type="text"
                      placeholder="ZIP Code (e.g. 75001)"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({...addressForm, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[11px] text-white/60 mb-0.5">Country</label>
                  <input
                    type="text"
                    placeholder="Country"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                    className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/10 font-medium text-sm text-white/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={updateDeliveryAddress}
                  className="flex-1 py-3 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-lg font-bold text-sm transition cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}