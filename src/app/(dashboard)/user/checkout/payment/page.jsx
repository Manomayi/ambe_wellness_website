"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { doc, getDoc, onSnapshot, deleteDoc, collection, getDocs, setDoc, updateDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRemotePaymentConfig } from '@/lib/remoteConfig';
import BackButton from '@/components/common/BackButton';

// Set to false in .env (or Vercel environment variables) if you only want backend Stripe webhooks to write to Firestore
const ENABLE_CLIENT_SIDE_FALLBACK_WRITE = process.env.NEXT_PUBLIC_ENABLE_CLIENT_PURCHASE_WRITE !== 'false';


function CheckoutForm({ clientSecret, paymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const completeOrderAndRedirect = async (amount = null, currency = 'USD') => {
    if (!user) return;

    if (ENABLE_CLIENT_SIDE_FALLBACK_WRITE) {
      try {
        // 1. Fetch current cart items to record them with the order
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

        // 2. Save purchase document in users/{uid}/purchases/{paymentIntentId}
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

        // 3. Mark user as having made a purchase & update referral credits
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        // If user used a referral credit, deduct it and record the order
        if ((userData.referral_credits || 0) > 0) {
          await updateDoc(userDocRef, {
            referral_credits: Math.max(0, (userData.referral_credits || 1) - 1),
            referral_credit_orders: arrayUnion(paymentIntentId || String(Date.now())),
            has_made_purchase: true
          }).catch(() => {});
        } else {
          await updateDoc(userDocRef, {
            has_made_purchase: true
          }).catch(() => {});
        }

        // If this user was referred by someone and this is their first order, reward the referrer
        if (userData.referred_by && !userData.referral_reward_granted) {
          await updateDoc(userDocRef, {
            referral_reward_granted: true,
            referral_status: 'completed'
          }).catch(() => {});

          const referrerDocRef = doc(db, 'users', userData.referred_by);
          await updateDoc(referrerDocRef, {
            referral_credits: increment(1),
            referral_count: increment(1)
          }).catch(() => {});
        }

        // 4. Clear cart
        const deletePromises = cartSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error recording purchase fallback:', err);
      }
    }

    // 5. Redirect to checkout success page
    setTimeout(() => {
      router.push('/user/checkout/success');
    }, 1200);
  };

  useEffect(() => {
    if (!stripe || !paymentIntentId || !user) return;

    // Listen for backend webhook / purchase confirmation
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'purchases', paymentIntentId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.status === 'succeeded' && !isProcessing) {
            router.push('/user/checkout/success');
          }
        }
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to purchase confirmation:', err);
      }
    );

    return () => unsubscribe();
  }, [stripe, paymentIntentId, user, router, isProcessing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/checkout/success`,
        },
        redirect: 'if_required'
      });

      if (result.error) {
        if (result.error.type === "card_error" || result.error.type === "validation_error") {
          setMessage(result.error.message);
        } else {
          setMessage("An unexpected error occurred. Please try again.");
        }
        setIsProcessing(false);
      } else if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        setMessage("Payment successful! Completing your order...");
        const finalAmount = result.paymentIntent.amount ? (result.paymentIntent.amount / 100) : null;
        const finalCurrency = result.paymentIntent.currency || 'USD';
        await completeOrderAndRedirect(finalAmount, finalCurrency);
      } else {
        setMessage("Payment was not completed. Status: " + (result.paymentIntent?.status || 'unknown'));
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setMessage("Payment failed. Please check your payment details and try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: {
            applePay: "never",
            googlePay: "never",
          },
        }}
      />

      <button
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-4 rounded-xl font-bold text-base transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md uppercase tracking-wider cursor-pointer"
      >
        {isProcessing ? "Processing..." : "Pay now"}
      </button>

      {message && (
        <div className={`text-center p-3 rounded-lg text-sm ${message.includes('successful') ? 'bg-[#FFD3AC]/15 text-[#FFD3AC] border border-[#FFD3AC]/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
          {message}
        </div>
      )}
    </form>
  );
}

function ApplePayCheckoutForm({ clientSecret, paymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
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
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        if ((userData.referral_credits || 0) > 0) {
          await updateDoc(userDocRef, {
            referral_credits: Math.max(0, (userData.referral_credits || 1) - 1),
            referral_credit_orders: arrayUnion(paymentIntentId || String(Date.now())),
            has_made_purchase: true
          }).catch(() => {});
        } else {
          await updateDoc(userDocRef, {
            has_made_purchase: true
          }).catch(() => {});
        }

        if (userData.referred_by && !userData.referral_reward_granted) {
          await updateDoc(userDocRef, {
            referral_reward_granted: true,
            referral_status: 'completed'
          }).catch(() => {});

          const referrerDocRef = doc(db, 'users', userData.referred_by);
          await updateDoc(referrerDocRef, {
            referral_credits: increment(1),
            referral_count: increment(1)
          }).catch(() => {});
        }

        const deletePromises = cartSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (err) {
        console.error('Error recording purchase fallback:', err);
      }
    }

    setTimeout(() => {
      router.push('/user/checkout/success');
    }, 1200);
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

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('client_secret');
  const paymentIntentId = searchParams.get('payment_intent');
  const selectedMethod = searchParams.get('method') || 'stripe';
  const paramTestMode = searchParams.get('test_mode') === 'true';
  const { isTestMode: remoteTestMode, stripePromise, loading: configLoading } = useRemotePaymentConfig();
  const isTestMode = paramTestMode || remoteTestMode;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientSecret) {
      setLoading(false);
    } else {
      // No client secret, redirect back
      window.location.href = '/user/cart';
    }
  }, [clientSecret]);

  if (loading || configLoading || !clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
      </div>
    );
  }

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#FFD3AC',
      colorBackground: '#242427',
      colorText: '#ffffff',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, sans-serif',
      borderRadius: '12px',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      <BackButton href="/user/checkout" label="Back to Checkout" />
      <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
        <h1 className="text-2xl font-bold text-white">
          {selectedMethod === 'apple_pay' ? 'Apple Pay' : 'Card Payment'}
        </h1>

        <Elements options={options} stripe={stripePromise}>
          {selectedMethod === 'apple_pay' ? (
            <ApplePayCheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
          ) : (
            <CheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
          )}
        </Elements>

        <div className="text-center">
          <p className="text-xs text-white/50">
            Your payment information is encrypted and secured by Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}


export default function PaymentPage() {
  return (
    <ProtectedRoute userType="user">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      }>
        <PaymentPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}