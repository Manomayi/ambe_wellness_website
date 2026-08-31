"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { doc, getDoc, onSnapshot, deleteDoc, collection, getDocs, setDoc, updateDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

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
        const items = cartSnapshot.docs.map(d => ({
          id: d.id,
          name: d.data().productName || d.data().product_name || d.data().name || 'Product',
          price: d.data().mrp || d.data().price || 0,
          quantity: d.data().quantity || 1,
          size: d.data().size || d.data().variantName || 'Standard',
        }));

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
        setMessage("Payment submitted. Redirecting...");
        await completeOrderAndRedirect();
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setMessage("Payment processed. Completing order...");
      await completeOrderAndRedirect();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs"
        }}
      />

      <button
        disabled={isProcessing || !stripe || !elements}
        className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 rounded-xl font-medium text-base transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm uppercase tracking-wider"
      >
        {isProcessing ? "Processing..." : "Pay now"}
      </button>

      {message && (
        <div className={`text-center p-3 rounded-lg text-sm ${message.includes('successful') ? 'bg-[#FAF8F5] text-[#C8996A] border border-[#C8996A]/30' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}
    </form>
  );
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('client_secret');
  const paymentIntentId = searchParams.get('payment_intent');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientSecret) {
      setLoading(false);
    } else {
      // No client secret, redirect back
      window.location.href = '/user/cart';
    }
  }, [clientSecret]);

  if (loading || !clientSecret) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#C8996A',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-[#E7E2D9] rounded-xl p-8 shadow-sm space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 text-center">Complete Payment</h1>

      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
      </Elements>

      <div className="text-center">
        <p className="text-xs text-[#8C827A]">
          Your payment information is secure and encrypted.
        </p>
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