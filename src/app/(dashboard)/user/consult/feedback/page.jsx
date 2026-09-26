"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarIconOutline, ArrowPathIcon } from "@heroicons/react/24/outline";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useRemotePaymentConfig } from "@/lib/remoteConfig";
import { startPayPalCheckout } from "@/lib/paypal";
import { recordContribution } from "@/lib/contributionService";

function StripePostContributionForm({ amount, paymentIntentId, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
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
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setErrorMsg(result.error.message || "Payment confirmation failed.");
        setProcessing(false);
      } else if (
        result.paymentIntent &&
        (result.paymentIntent.status === "succeeded" ||
          result.paymentIntent.status === "processing")
      ) {
        await onSuccess(result.paymentIntent.id || paymentIntentId);
      } else {
        setErrorMsg("Payment was not completed. Please try again.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMsg("Payment could not be confirmed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {errorMsg && (
        <div className="bg-red-950/60 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl">
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold py-3.5 px-6 rounded-full transition flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            Processing ${amount}...
          </>
        ) : (
          `Confirm $${amount} Contribution`
        )}
      </button>
    </form>
  );
}

function ConsultationFeedbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const { isTestMode, stripePromise } = useRemotePaymentConfig();

  const queryDoctorUid = searchParams.get("doctorUid");
  const queryDoctorName = searchParams.get("doctorName");
  const consultationId = searchParams.get("consultationId") || "";

  const effectiveDoctorUid =
    queryDoctorUid ||
    profile?.doctor?.uid ||
    (typeof profile?.doctor === "string" ? profile.doctor : "") ||
    profile?.doctor_uid ||
    profile?.matched_doctor ||
    "";

  const effectiveDoctorName =
    queryDoctorName ||
    profile?.doctor_name ||
    (profile?.doctor?.first_name
      ? `${profile.doctor.first_name} ${profile.doctor.last_name || ""}`.trim()
      : "");

  // Phase 1: Review State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Phase 2: Contribution State
  const [selectedPreset, setSelectedPreset] = useState(null); // 49, 99, 149
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomFocused, setIsCustomFocused] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [activeContribAmount, setActiveContribAmount] = useState(0);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [contribSuccess, setContribSuccess] = useState(false);

  // Lock body scroll when payment modal is open
  useEffect(() => {
    if (showPaymentModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showPaymentModal]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!effectiveDoctorUid) {
      setReviewError("Missing doctor information — please return to Consult.");
      return;
    }
    if (rating === 0) {
      setReviewError("Please select a star rating.");
      return;
    }
    if (!review.trim()) {
      setReviewError("Please share your experience.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");

    try {
      await addDoc(collection(db, "reviews"), {
        targetType: "doctor",
        targetId: effectiveDoctorUid,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: profile?.profile_picture || user.photoURL || null,
        rating,
        review: review.trim(),
        consultationId: consultationId || null,
        createdAt: serverTimestamp(),
      });

      // Hide feedback view
      setReviewSubmitted(true);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setReviewError("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartContribution = async () => {
    let amount = 0;
    if (selectedPreset) {
      amount = selectedPreset;
    } else {
      amount = Number(customAmount);
    }

    if (!amount || amount <= 0) {
      alert("Please select or enter a contribution amount, or click 'No thank you'.");
      return;
    }

    setActiveContribAmount(amount);
    setShowPaymentModal(true);

    // Initialize Stripe intent
    setLoadingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: "usd",
          userId: user.uid,
          doctorId: effectiveDoctorUid,
          doctorName: effectiveDoctorName,
          type: "contribution_after",
          description: `Post-Consultation Contribution - $${amount}`,
          isTestMode: Boolean(isTestMode),
        }),
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId || "");
      }
    } catch (err) {
      console.error("Error initializing payment:", err);
    } finally {
      setLoadingIntent(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (paypalProcessing || !activeContribAmount) return;
    setPaypalProcessing(true);

    try {
      await startPayPalCheckout({
        amountCents: Math.round(activeContribAmount * 100),
        type: "contribution_after",
        isTestMode: Boolean(isTestMode),
        onSuccess: async ({ orderId }) => {
          await handleContributionSuccess(orderId, "paypal");
          setPaypalProcessing(false);
        },
        onError: (err) => {
          console.error("PayPal error:", err);
          alert(err.message || "PayPal contribution failed.");
          setPaypalProcessing(false);
        },
        onCancel: () => {
          setPaypalProcessing(false);
        },
      });
    } catch (e) {
      console.error("PayPal flow error:", e);
      setPaypalProcessing(false);
    }
  };

  const handleContributionSuccess = async (paymentId, method = "card") => {
    setShowPaymentModal(false);
    setContribSuccess(true);

    try {
      await recordContribution({
        user,
        amount: activeContribAmount,
        type: "after_consultation",
        paymentMethod: method,
        paymentId,
        consultationId: consultationId || null,
        doctorUid: effectiveDoctorUid,
        doctorName: effectiveDoctorName,
      });
    } catch (err) {
      console.error("Error recording contribution:", err);
    }

    setTimeout(() => {
      router.push("/user/consult");
    }, 2000);
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="min-h-screen bg-[#141414] py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Phase 1: Doctor Review Section (Hides when submitted) */}
        {!reviewSubmitted && (
          <div className="space-y-6">
            <div className="text-left">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">
                How was your consultation?
              </h1>
              <p className="text-white/70 text-sm">
                Your feedback helps us continue matching you with the right care.
              </p>
            </div>

            {reviewError && (
              <div className="bg-red-950/60 border border-red-500/50 text-red-200 rounded-xl p-3 text-sm">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Stars */}
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= displayRating;
                  const Star = filled ? StarIconSolid : StarIconOutline;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`${star} star`}
                    >
                      <Star className="w-10 h-10 text-[#FFD3AC]" />
                    </button>
                  );
                })}
              </div>

              {/* Review Text */}
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                placeholder="Tell us about your experience..."
                className="w-full rounded-2xl bg-[#1E1E1E] border border-white/10 p-4 text-white placeholder-white/40 focus:outline-none focus:border-[#FFD3AC] text-sm"
              />

              {/* Submit Review Button */}
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold py-4 rounded-full transition duration-200 text-sm tracking-wider uppercase disabled:opacity-50"
              >
                {submittingReview ? "Submitting Review..." : "SUBMIT REVIEW"}
              </button>
            </form>
          </div>
        )}

        {/* Divider: One last thing */}
        {!reviewSubmitted && (
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-serif italic text-white/50 text-base">
              One last thing
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        )}

        {/* Phase 2: Complete Your Contribution Card */}
        <div className="bg-[#1E1E1E] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white mb-2">
              Complete Your Contribution
            </h2>
            <p className="text-white/60 text-xs md:text-sm leading-relaxed">
              Your $50 deposit will be applied to your session unless you request a
              refund — or add more to your contribution below.
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-semibold mb-3">
              Add to your contribution (optional)
            </label>

            {/* Quick Chips: +$49, +$99, +$149 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[49, 99, 149].map((amt) => {
                const isSelected = selectedPreset === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(amt);
                      setCustomAmount("");
                    }}
                    className={`py-3.5 rounded-2xl font-bold text-base transition border ${
                      isSelected
                        ? "bg-[#282828] border-[#FFD3AC] text-[#FFD3AC]"
                        : "bg-[#282828] border-white/10 text-white hover:border-white/20"
                    }`}
                  >
                    +${amt}
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div
              className={`rounded-2xl bg-[#282828] border px-4 py-2 flex items-center transition ${
                !selectedPreset && (isCustomFocused || customAmount)
                  ? "border-[#FFD3AC] ring-0"
                  : "border-white/10"
              }`}
            >
              <span
                className={`text-lg font-bold mr-2 ${
                  !selectedPreset && (isCustomFocused || customAmount)
                    ? "text-[#FFD3AC]"
                    : "text-white/50"
                }`}
              >
                $
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={customAmount}
                onFocus={() => {
                  setSelectedPreset(null);
                  setIsCustomFocused(true);
                }}
                onBlur={() => setIsCustomFocused(false)}
                onChange={(e) => {
                  setSelectedPreset(null);
                  setCustomAmount(e.target.value);
                }}
                placeholder="Enter your own amount"
                className="w-full bg-transparent text-white text-sm font-semibold focus:outline-none focus:ring-0 border-0 placeholder-white/30"
              />
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleStartContribution}
            className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold py-4 rounded-full transition duration-200 text-sm tracking-wider uppercase shadow-lg"
          >
            CONFIRM CONTRIBUTION
          </button>

          {/* Skip Link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => router.push("/user/consult")}
              className="text-white/60 hover:text-white text-sm font-medium transition"
            >
              No thank you
            </button>
          </div>
        </div>

        {/* Success message */}
        {contribSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 p-4 rounded-2xl text-center text-sm font-medium">
            Thank you for your generous contribution! Redirecting...
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPaymentModal(false);
            }}
          >
            <div
              className="bg-[#1E1E1E] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] my-0 sm:my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 shrink-0">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    Select Payment Method
                  </h3>
                  <p className="text-[#FFD3AC] text-sm font-semibold">
                    Contribution: ${activeContribAmount} USD
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto space-y-5 flex-1 pr-1 -mr-1 mt-4">
                {/* Tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${
                      paymentMethod === "card"
                        ? "bg-[#FFD3AC] text-black font-semibold"
                        : "bg-[#282828] text-white/70 hover:text-white"
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition ${
                      paymentMethod === "paypal"
                        ? "bg-[#FFD3AC] text-black font-semibold"
                        : "bg-[#282828] text-white/70 hover:text-white"
                    }`}
                  >
                    PayPal
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  loadingIntent || !clientSecret ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3 text-white/70">
                      <ArrowPathIcon className="w-8 h-8 animate-spin text-[#FFD3AC]" />
                      <p className="text-sm">Preparing secure checkout...</p>
                    </div>
                  ) : (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "night",
                          variables: {
                            colorPrimary: "#FFD3AC",
                            colorBackground: "#282828",
                            colorText: "#ffffff",
                          },
                        },
                      }}
                    >
                      <StripePostContributionForm
                        amount={activeContribAmount}
                        paymentIntentId={paymentIntentId}
                        onSuccess={(intentId) =>
                          handleContributionSuccess(intentId, "card")
                        }
                      />
                    </Elements>
                  )
                ) : (
                  <div className="space-y-4 py-4">
                    <button
                      type="button"
                      onClick={handlePayPalCheckout}
                      disabled={paypalProcessing}
                      className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold py-3.5 px-6 rounded-full transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      {paypalProcessing ? (
                        <>
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          Connecting to PayPal...
                        </>
                      ) : (
                        "Pay with PayPal"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsultationFeedbackPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white/60">
            Loading feedback...
          </div>
        }
      >
        <ConsultationFeedbackPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
