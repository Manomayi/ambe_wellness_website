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
import { doc, onSnapshot, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret, paymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!stripe || !paymentIntentId) return;

    // Listen for payment confirmation
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid, 'purchases', paymentIntentId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.status === 'succeeded') {
            // Clear cart
            clearCart();
            // Show success and redirect
            setTimeout(() => {
              router.push('/user/home');
            }, 2000);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [stripe, paymentIntentId, user, router]);

  const clearCart = async () => {
    try {
      const cartSnapshot = await getDocs(collection(db, 'users', user.uid, 'cart'));
      const deletePromises = cartSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user/checkout/success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
      setIsProcessing(false);
    } else {
      // Payment succeeded - the listener will handle the redirect
      setMessage("Payment successful! Redirecting...");
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
        className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isProcessing ? "Processing..." : "Pay now"}
      </button>
      
      {message && (
        <div className={`text-center p-3 rounded-lg ${message.includes('successful') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#16a34a',
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="max-w-md mx-auto p-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Complete Payment</h1>
      
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} />
      </Elements>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }>
        <PaymentPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}