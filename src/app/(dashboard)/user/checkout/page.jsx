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
  setDoc,
  deleteDoc,
  serverTimestamp,
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
import {
  Elements,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const ENABLE_CLIENT_SIDE_FALLBACK_WRITE = process.env.NEXT_PUBLIC_ENABLE_CLIENT_PURCHASE_WRITE !== 'false';

async function runReferralCompletion(orderId, creditsUsed = 0) {
  try {
    const completeReferralFn = httpsCallable(functions, 'completeReferralForOrder');
    await completeReferralFn({
      orderId: orderId,
      creditsUsed: Number(creditsUsed) || 0,
    });
  } catch (refErr) {
    console.warn('⚠️ completeReferralForOrder warning:', refErr);
  }
}

function ApplePayCheckoutInline({
  clientSecret,
  paymentIntentId,
  user,
  cartItems,
  referralCreditsToUse,
  onSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);
  const [applePayAvailable, setApplePayAvailable] = useState(true);

  const completeOrderAndRedirect = async (amount = null, currency = 'USD') => {
    if (!user) return;

    if (ENABLE_CLIENT_SIDE_FALLBACK_WRITE) {
      try {
        const cartSnapshot = await getDocs(collection(db, 'users', user.uid, 'cart'));
        const items = cartSnapshot.docs.map(d => {
          const data = d.data();
          const prodName = data.productName || data.product_name || data.name || 'Product';
          const prodId = data.productId || data.product_id || data.id || d.id;
          return {
            id: d.id,
            product_id: prodId,
            productId: prodId,
            product_name: prodName,
            productName: prodName,
            name: prodName,
            price: data.mrp || data.price || 0,
            quantity: data.quantity || 1,
            size: data.size || data.variantName || 'Standard',
            shop_id: data.shop_id || data.shopId || null,
            imageUrl: data.imageUrl || data.image_url || null,
          };
        });

        if (paymentIntentId) {
          const purchaseRef = doc(db, 'users', user.uid, 'purchases', paymentIntentId);
          await setDoc(purchaseRef, {
            id: paymentIntentId,
            amount: amount !== null ? amount : (items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)),
            currency: currency.toUpperCase(),
            status: 'succeeded',
            type: 'store',
            items: items,
            created: serverTimestamp(),
            payment_intent_id: paymentIntentId,
          }, { merge: true });
        }

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          has_made_purchase: true,
        }).catch(() => {});

        await runReferralCompletion(paymentIntentId, referralCreditsToUse);

        const deletePromises = cartSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error recording purchase fallback:', err);
      }
    }

    if (onSuccess) onSuccess();
  };

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setMessage(submitError.message);
        setIsProcessing(false);
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/checkout/success`,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        setMessage(result.error.message || "Apple Pay payment failed.");
        setIsProcessing(false);
      } else if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        setMessage("Payment successful! Completing your order...");
        const finalAmount = result.paymentIntent.amount ? (result.paymentIntent.amount / 100) : null;
        const finalCurrency = result.paymentIntent.currency || 'USD';
        await completeOrderAndRedirect(finalAmount, finalCurrency);
      } else {
        setMessage("Payment was not completed.");
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Apple Pay confirm error:', err);
      setMessage("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {!applePayAvailable && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
          Apple Pay requires Safari on an Apple device (iPhone, iPad, or Mac) with an active card in Apple Wallet.
        </div>
      )}

      <ExpressCheckoutElement
        onConfirm={handleConfirm}
        onReady={({ availablePaymentMethods }) => {
          if (!availablePaymentMethods || !availablePaymentMethods.applePay) {
            setApplePayAvailable(false);
          } else {
            setApplePayAvailable(true);
          }
        }}
        options={{
          wallets: {
            applePay: 'always',
            googlePay: 'never',
          },
          buttonType: {
            applePay: 'plain',
          },
          buttonTheme: {
            applePay: 'white',
          },
          buttonHeight: 48,
        }}
      />

      {isProcessing && (
        <div className="text-center py-2 text-xs text-white/60">
          Processing Apple Pay...
        </div>
      )}

      {message && (
        <div className={`text-center p-3 rounded-lg text-sm ${message.includes('successful') ? 'bg-[#FFD3AC]/15 text-[#FFD3AC] border border-[#FFD3AC]/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

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
    apartmentNumber: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

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
  const { isTestMode, stripePromise, loading: configLoading } = useRemotePaymentConfig();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [referralCreditsToUse, setReferralCreditsToUse] = useState(0);

  const [applePayClientSecret, setApplePayClientSecret] = useState('');
  const [applePayPaymentIntentId, setApplePayPaymentIntentId] = useState('');
  const [loadingApplePayIntent, setLoadingApplePayIntent] = useState(false);

  const initApplePayIntent = async () => {
    if (!user || total <= 0 || !deliveryAddress.trim() || isTaxCalculating) return;
    setLoadingApplePayIntent(true);
    let secret = "";
    let pId = "";
    try {
      const createPaymentIntentStore = httpsCallable(functions, 'createPaymentIntentStore');
      const result = await createPaymentIntentStore({
        amount: Math.round(total * 100),
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
      if (result.data?.clientSecret) {
        secret = result.data.clientSecret;
        pId = result.data.paymentIntentId || "";
      }
    } catch (e) {
      console.warn('createPaymentIntentStore failed, falling back to API route:', e);
    }

    if (!secret) {
      try {
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
        secret = data.clientSecret;
        pId = data.paymentIntentId || "";
      } catch (err) {
        console.error('API create payment intent error:', err);
      }
    }

    setApplePayClientSecret(secret);
    setApplePayPaymentIntentId(pId);
    setLoadingApplePayIntent(false);
  };

  useEffect(() => {
    if (paymentMethod === 'apple_pay' && deliveryAddress.trim() && total > 0 && !isTaxCalculating) {
      initApplePayIntent();
    }
  }, [paymentMethod, total, deliveryAddress, isTaxCalculating, isTestMode]);

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
          fields: ['address_components', 'formatted_address', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.address_components) return;

          let streetNumber = '';
          let streetName = '';
          let city = '';
          let state = '';
          let zipCode = '';
          let country = '';

          for (const comp of place.address_components) {
            const types = comp.types || [];
            if (types.includes('street_number')) {
              streetNumber = comp.long_name;
            } else if (types.includes('route')) {
              streetName = comp.long_name;
            } else if (types.includes('locality')) {
              city = comp.long_name;
            } else if (types.includes('sublocality_level_1') || types.includes('sublocality')) {
              if (!city) city = comp.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              if (!city) city = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = comp.short_name || comp.long_name;
            } else if (types.includes('postal_code')) {
              zipCode = comp.long_name;
            } else if (types.includes('country')) {
              country = comp.long_name;
            }
          }

          const combinedStreet = [streetNumber, streetName].filter(Boolean).join(' ') || place.name || (place.formatted_address ? place.formatted_address.split(',')[0] : '');
          setAddressForm((prev) => ({
            ...prev,
            streetAddress: combinedStreet,
            streetNumber: streetNumber || prev.streetNumber,
            streetName: streetName || combinedStreet || prev.streetName,
            city: city || prev.city,
            state: state || prev.state,
            zipCode: zipCode || prev.zipCode,
            country: country || prev.country || '',
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
            const aptStr = addr.apartmentNumber ? ` Apt ${addr.apartmentNumber}` : '';
            const formatted = typeof addr === 'string'
              ? addr
              : [
                  [addr.streetNumber, addr.streetName].filter(Boolean).join(' ') + aptStr,
                  addr.city,
                  addr.state,
                  addr.zipCode,
                  addr.country
                ].filter(Boolean).join(', ');
            setDeliveryAddress(formatted);
            if (typeof addr === 'object') {
              setAddressForm({
                ...addr,
                apartmentNumber: addr.apartmentNumber || '',
              });
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
      refDiscount = sub * 0.10; // 10% off first purchase
      creditsToUse = 0;
    } else if (referralCredits > 0) {
      refDiscount = sub * 0.10; // 10% off using one credit
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

  const reverseGeocodeCoords = async (lat, lng) => {
    // 1. Call server-side API route (handles Google Geocoding, Nominatim fallback without CORS or client console errors)
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return {
            streetAddress: data.streetAddress || '',
            streetNumber: data.streetNumber || '',
            streetName: data.streetName || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            country: data.country || '',
          };
        }
      }
    } catch (e) {
      console.warn('Server reverse-geocode error, falling back to BigDataCloud:', e);
    }

    // 2. Direct client fallback to BigDataCloud (supports CORS)
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        if (bdcData) {
          const street = bdcData.localityInfo?.administrative?.[0]?.name || bdcData.locality || '';
          const city = bdcData.city || bdcData.locality || '';
          const state = bdcData.principalSubdivision || '';
          const zipCode = bdcData.postcode || '';
          const country = bdcData.countryName || '';

          return {
            streetAddress: street,
            streetNumber: '',
            streetName: '',
            city,
            state,
            zipCode,
            country,
          };
        }
      }
    } catch (e) {
      console.warn('BigDataCloud reverse geocode failed:', e);
    }

    return null;
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const result = await reverseGeocodeCoords(lat, lng);
          if (result && (result.streetAddress || result.city || result.state || result.zipCode)) {
            setAddressForm((prev) => ({
              ...prev,
              streetAddress: result.streetAddress || prev.streetAddress,
              streetNumber: result.streetNumber || prev.streetNumber,
              streetName: result.streetName || prev.streetName,
              city: result.city || prev.city,
              state: result.state || prev.state,
              zipCode: result.zipCode || prev.zipCode,
              country: result.country || prev.country || '',
            }));
            if (searchInputRef.current) {
              searchInputRef.current.value = result.streetAddress || '';
            }
          } else {
            alert('Could not determine address for your current location.');
          }
        } catch (err) {
          console.error('Error reverse geocoding location:', err);
          alert('Failed to detect address from current location.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert(
          error.code === 1
            ? 'Location permission denied. Please allow location access in your browser settings.'
            : 'Unable to retrieve location.'
        );
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const updateDeliveryAddress = async () => {
    const fullStreet = addressForm.streetAddress !== undefined
      ? addressForm.streetAddress.trim()
      : [addressForm.streetNumber, addressForm.streetName].filter(Boolean).join(' ').trim();

    if (!fullStreet) {
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

    setIsSavingAddress(true);
    try {
      let sNum = addressForm.streetNumber || '';
      let sName = addressForm.streetName || fullStreet;
      if (addressForm.streetAddress !== undefined) {
        const firstSpace = fullStreet.indexOf(' ');
        if (firstSpace > 0) {
          const cand = fullStreet.substring(0, firstSpace).trim();
          if (/^\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?$/.test(cand)) {
            sNum = cand;
            sName = fullStreet.substring(firstSpace + 1).trim();
          } else {
            sNum = '';
            sName = fullStreet;
          }
        } else {
          sNum = '';
          sName = fullStreet;
        }
      }

      const addressToSave = {
        streetNumber: sNum,
        streetName: sName,
        apartmentNumber: addressForm.apartmentNumber?.trim() || '',
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        zipCode: addressForm.zipCode.trim(),
        country: addressForm.country?.trim() || '',
      };

      await updateDoc(doc(db, 'users', user.uid), {
        delivery_address: addressToSave
      });
      const aptStr = addressForm.apartmentNumber?.trim() ? ` Apt ${addressForm.apartmentNumber.trim()}` : '';
      const formatted = [
        [sNum, sName].filter(Boolean).join(' ') + aptStr,
        addressForm.city?.trim(),
        addressForm.state?.trim(),
        addressForm.zipCode?.trim(),
        addressForm.country?.trim()
      ].filter(Boolean).join(', ');
      setDeliveryAddress(formatted);
      setShowAddressModal(false);
    } catch (error) {
      console.error('Error updating address:', error);
      alert('Failed to update address');
    } finally {
      setIsSavingAddress(false);
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
        {/* Sticky Top Bar with Back Button and Checkout title */}
        <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 mb-6 border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-3">
            <AmbeBackButton href="/user/cart" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Checkout
            </h1>
          </div>
        </div>

        <div className="space-y-6 pb-36">
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
                      ? 'First Purchase Referral Discount (10%)'
                      : `Referral Discount (10% - ${(userData?.referral_credits || 0) - 1} left)`}
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

        {/* Apple Pay Direct Box (Matches Image 2 design, opens Apple Pay sheet on single click) */}
        {paymentMethod === 'apple_pay' ? (
          !deliveryAddress.trim() ? (
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-3">
              <h3 className="font-serif text-2xl font-bold text-white">Apple Pay</h3>
              <p className="text-white/70 text-sm">Please add a delivery address above to proceed with Apple Pay.</p>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="w-full py-3.5 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-xl font-bold text-sm transition cursor-pointer uppercase tracking-wider"
              >
                Add Delivery Address
              </button>
            </div>
          ) : isTaxCalculating || loadingApplePayIntent || !applePayClientSecret ? (
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col items-center justify-center space-y-2 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FFD3AC] border-t-transparent" />
              <p className="text-xs text-white/60">
                {isTaxCalculating ? "Calculating tax..." : "Loading Apple Pay..."}
              </p>
            </div>
          ) : (
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <h3 className="font-serif text-2xl font-bold text-white">Apple Pay</h3>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: applePayClientSecret,
                  appearance: {
                    theme: 'night',
                    variables: { colorPrimary: '#FFD3AC', colorBackground: '#1E1E1E', colorText: '#ffffff' }
                  }
                }}
              >
                <ApplePayCheckoutInline
                  clientSecret={applePayClientSecret}
                  paymentIntentId={applePayPaymentIntentId}
                  user={user}
                  cartItems={cartItems}
                  referralCreditsToUse={referralCreditsToUse}
                  onSuccess={() => router.push('/user/checkout/success')}
                />
              </Elements>
              <p className="text-white/40 text-xs">Your payment information is encrypted and secured by Stripe.</p>
            </div>
          )
        ) : (
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
              : 'PROCEED TO CARD PAYMENT'}
          </button>
        )}


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
                    Search your address
                  </label>
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search your address..."
                      className="w-full pl-9 pr-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                    />
                    <MagnifyingGlassIcon className="w-4 h-4 text-white/40 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                  <div className="mt-2 flex items-center">
                    <button
                      type="button"
                      disabled={isGettingLocation}
                      onClick={handleUseCurrentLocation}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FFD3AC] hover:text-[#ffe0c4] transition cursor-pointer disabled:opacity-50"
                    >
                      <svg
                        className={`w-3.5 h-3.5 ${isGettingLocation ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {isGettingLocation ? 'Detecting location...' : 'Use Current Location'}
                    </button>
                  </div>
                  <span className="text-[11px] text-white/50 mt-1 block">
                    Or enter and edit the address details manually below:
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-0.5">Street Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Main St"
                    value={
                      addressForm.streetAddress !== undefined
                        ? addressForm.streetAddress
                        : [addressForm.streetNumber, addressForm.streetName].filter(Boolean).join(' ')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      let sNum = '';
                      let sName = val.trim();
                      const firstSpace = val.trim().indexOf(' ');
                      if (firstSpace > 0) {
                        const cand = val.trim().substring(0, firstSpace).trim();
                        if (/^\d+[a-zA-Z]?(?:[-/]\d+[a-zA-Z]?)?$/.test(cand)) {
                          sNum = cand;
                          sName = val.trim().substring(firstSpace + 1).trim();
                        }
                      }
                      setAddressForm((prev) => ({
                        ...prev,
                        streetAddress: val,
                        streetNumber: sNum,
                        streetName: sName,
                      }));
                    }}
                    className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-white/60 mb-0.5">Apartment Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Apt 4B"
                    value={addressForm.apartmentNumber || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, apartmentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-white/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] text-sm text-white placeholder-white/40 bg-white/5"
                  />
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
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 border border-white/20 rounded-lg hover:bg-white/10 font-medium text-sm text-white/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingAddress || isGettingLocation}
                  onClick={updateDeliveryAddress}
                  className="flex-1 py-3 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-lg font-bold text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGettingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                      <span>Detecting location...</span>
                    </>
                  ) : isSavingAddress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Address'
                  )}
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