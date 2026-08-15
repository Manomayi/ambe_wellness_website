"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import BackButton from "@/components/common/BackButton";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// Set to false in .env (or Vercel environment variables) if you only want backend Stripe webhooks to write to Firestore
const ENABLE_CLIENT_SIDE_FALLBACK_WRITE = process.env.NEXT_PUBLIC_ENABLE_CLIENT_PURCHASE_WRITE !== 'false';

function CheckoutForm({ user, paymentIntentId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.href },
        redirect: 'if_required',
      });

      if (result.error) {
        alert(result.error.message);
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
              created: serverTimestamp(),
              payment_intent_id: intentId,
            }, { merge: true });

            // 2. Set subscription active
            await updateDoc(doc(db, 'users', user.uid), {
              'subscription.active': true,
              'subscription.status': 'active',
              'subscription.deposit_paid': true,
            }).catch(() => {});

            // 3. Match with doctor
            try {
              await fetch(
                `${process.env.NEXT_PUBLIC_API_ENDPOINT}/actions/matchWithDoctor`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ uid: user.uid }),
                }
              );
            } catch (mErr) {
              console.error('Match doctor error:', mErr);
            }
          } catch (pErr) {
            console.error('Error saving subscription purchase fallback:', pErr);
          }
        }

        router.push("/user/consult/schedule");
      }
    } catch (err) {
      console.error('Payment confirm error:', err);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 rounded-xl font-medium text-base transition disabled:opacity-50 shadow-sm uppercase tracking-wider"
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
  const [hasMatched, setHasMatched] = useState(false);

  // require auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) return router.push("/login");
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  // 2) Listen for subscription.active & then MATCH + NAVIGATE
  useEffect(() => {
    if (!user) return;
    const unsubSnap = onSnapshot(
      doc(db, "users", user.uid),
      async (snap) => {
        const isActive = snap.data()?.subscription?.active;
        if (isActive && !hasMatched) {
          unsubSnap();
          setHasMatched(true);

          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_ENDPOINT}/actions/matchWithDoctor`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: user.uid }),
              }
            );
            if (res.ok) {
              router.push("/user/consult/schedule");
            } else {
              console.error("matchWithDoctor failed", res.status);
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    );
    return () => unsubSnap();
  }, [user, hasMatched, router]);

  // call your Cloud Function to create a PaymentIntent
  const handleProceed = async () => {
    setLoading(true);
    try {
      const functions = getFunctions(undefined, "us-central1");
      const fn = httpsCallable(functions, "createPaymentIntent");
      const { data } = await fn({
        amount: 5000, // $50
        currency: "usd",
        type: "subscription",
      });
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId || data.payment_intent_id || "");
    } catch (err) {
      console.error(err);
      alert("Error creating payment intent.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <BackButton />
      <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 shadow-sm space-y-6">
        <h1 className="text-2xl text-[#1A1A1A] font-bold">Payment</h1>
        <p className="text-sm text-[#6B6862] leading-relaxed">
          To secure your spot, a fully refundable $50 deposit is required that
          will go towards your custom remedies after your consultation.
        </p>

        {!clientSecret ? (
          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 rounded-xl font-medium text-base transition disabled:opacity-50 shadow-sm uppercase tracking-wider"
          >
            {loading ? "Loading…" : "Proceed to Payment"}
          </button>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <CheckoutForm user={user} paymentIntentId={paymentIntentId} />
          </Elements>
        )}
      </div>
    </div>
  );
}
