"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import BackButton from "@/components/common/BackButton";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Set to false in .env if you only want backend Stripe webhooks to write to Firestore
const ENABLE_CLIENT_SIDE_FALLBACK_WRITE = process.env.NEXT_PUBLIC_ENABLE_CLIENT_PURCHASE_WRITE !== 'false';

function CheckoutForm({ user, paymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setErrorMsg("");

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (result.error) {
        setErrorMsg(result.error.message || "Payment confirmation failed.");
        setProcessing(false);
      } else if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        const intentId = result.paymentIntent.id || paymentIntentId;
        
        if (ENABLE_CLIENT_SIDE_FALLBACK_WRITE && user && intentId) {
          try {
            // 1. Record in users/{uid}/purchases
            const purchaseRef = doc(db, 'users', user.uid, 'purchases', intentId);
            await setDoc(purchaseRef, {
              id: intentId,
              amount: 50.00,
              currency: 'USD',
              status: 'succeeded',
              type: 'subscription',
              description: 'Consultation Deposit & Membership Subscription',
              refund_policy: 'Full $50 refund within 30 days via info@ambewellness.com. 50% ($25) if missed.',
              created: serverTimestamp(),
              payment_intent_id: intentId,
            }, { merge: true });

            // 2. Set subscription active
            await updateDoc(doc(db, 'users', user.uid), {
              'subscription.active': true,
              'subscription.status': 'active',
              'subscription.deposit_paid': true,
            }).catch(() => {});
          } catch (pErr) {
            console.error('Error saving subscription purchase fallback:', pErr);
          }
        }

        router.push("/user/consult/schedule");
      }
    } catch (err) {
      console.error('Payment confirm error:', err);
      setErrorMsg("An error occurred confirming your payment. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 rounded-xl font-semibold text-base transition disabled:opacity-50 shadow-sm uppercase tracking-wider cursor-pointer"
      >
        {processing ? "Processing…" : "Pay $50 Deposit"}
      </button>
    </form>
  );
}

export default function UserPaymentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loading, setLoading] = useState(false);

  // require auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  // Create PaymentIntent
  const handleProceed = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Try server Next.js API route
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 5000,
          currency: "usd",
          userId: user.uid,
          description: "Consultation Deposit Fee"
        })
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId || "");
      } else {
        // Fallback to Cloud Function
        const functions = getFunctions(undefined, "us-central1");
        const fn = httpsCallable(functions, "createPaymentIntent");
        const { data: fbData } = await fn({
          amount: 5000,
          currency: "usd",
          type: "subscription",
        });
        setClientSecret(fbData.clientSecret);
        setPaymentIntentId(fbData.paymentIntentId || fbData.payment_intent_id || "");
      }
    } catch (err) {
      console.error("Payment intent creation error:", err);
      alert("Could not load the payment sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      <BackButton href="/user/home" label="Back to Home" />
      <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm space-y-6">
        <h1 className="text-2xl text-[#1A1A1A] font-bold">Consultation Deposit</h1>

        {/* Deposit & Refund Policy Card */}
        <div className="bg-[#FFF9F2] border border-[#FFD3AC] rounded-xl p-5 space-y-2 text-xs text-[#1A1A1A]">
          <div className="flex items-center gap-2 font-bold text-sm text-[#C2691C]">
            <ShieldCheckIcon className="w-5 h-5" />
            Deposit & Refund Policy
          </div>
          <p className="leading-relaxed text-[#353535]">
            To secure your spot, a <strong>$50 deposit</strong> is required for each consultation that will go towards your custom remedies after your consultation.
          </p>
          <ul className="list-disc list-inside space-y-1 text-[#353535] pt-1">
            <li>
              <strong>30-Day Full Refund:</strong> You can request a full refund for the $50 deposit by emailing{' '}
              <a 
                href="mailto:info@ambewellness.com" 
                className="font-semibold text-[#C2691C] underline hover:text-[#1A1A1A]"
              >
                info@ambewellness.com
              </a>{' '}
              within 30 days of the appointment date.
            </li>
            <li>
              <strong>Missed Consultation Policy:</strong> If you do not join the scheduled consultation, only <strong>50% ($25)</strong> of the deposit will be refunded.
            </li>
          </ul>
        </div>

        {!clientSecret ? (
          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 rounded-xl font-semibold text-base transition disabled:opacity-50 shadow-sm uppercase tracking-wider cursor-pointer"
          >
            {loading ? "Loading Payment Sheet…" : "Proceed to Payment"}
          </button>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ 
              clientSecret, 
              appearance: { 
                theme: "stripe",
                variables: { colorPrimary: '#C8996A' }
              } 
            }}
          >
            <CheckoutForm user={user} paymentIntentId={paymentIntentId} />
          </Elements>
        )}
      </div>
    </div>
  );
}
