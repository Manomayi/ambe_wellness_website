"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
    });
    if (error) {
      alert(error.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-50"
      >
        {processing ? "Processing…" : "Pay $50"}
      </button>
    </form>
  );
}

export default function MemberPaymentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
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
              alert("Error matching with doctor.");
            }
          } catch (err) {
            console.error(err);
            alert("Network error matching with doctor.");
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
    } catch (err) {
      console.error(err);
      alert("Error creating payment intent.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl text-black font-bold">Payment</h1>
      <p className="text-gray-700">
        To secure your spot, a fully refundable $50 deposit is required that
        will go towards your custom remedies after your consultation.
      </p>

      {!clientSecret ? (
        <button
          onClick={handleProceed}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-50"
        >
          {loading ? "Loading…" : "Proceed to Payment"}
        </button>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: "stripe" } }}
        >
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
