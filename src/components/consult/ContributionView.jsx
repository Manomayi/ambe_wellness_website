"use client";

import { useState, useEffect } from "react";
import { CheckIcon, ChevronLeftIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { startPayPalCheckout } from "@/lib/paypal";
import { recordContribution } from "@/lib/contributionService";

function StripeContributionCheckoutForm({
  amount,
  paymentIntentId,
  user,
  doctorInfo,
  onSuccess,
  onError,
}) {
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
        const intentId = result.paymentIntent.id || paymentIntentId;
        await onSuccess(intentId);
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
          {errorMsg}
        </div>
      )}
      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full bg-[#FFD3AC] text-[#1A1A1A] hover:bg-white font-semibold py-3.5 px-6 rounded-full transition duration-200 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <ArrowPathIcon className="w-5 h-5 animate-spin" />
            Processing ${amount}...
          </>
        ) : (
          `Pay $${amount} Contribution`
        )}
      </button>
    </form>
  );
}

export default function ContributionView({
  user,
  doctorInfo,
  selectedSlot,
  isTestMode = false,
  stripePromise,
  onSuccessSchedule,
  onProceedToDeposit,
  onBack,
}) {
  const [selectedOption, setSelectedOption] = useState(null); // 'option1' | 'option2'
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'paypal'
  const [activeAmount, setActiveAmount] = useState(149);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCheckoutModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCheckoutModal]);

  const handleStartContribution = async (amount) => {
    if (!amount || amount <= 0) {
      setErrorMessage("Please enter a valid contribution amount.");
      return;
    }
    setErrorMessage("");
    setActiveAmount(amount);
    setShowCheckoutModal(true);

    // Initialize Stripe Payment Intent
    setLoadingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: "usd",
          userId: user.uid,
          doctorId: doctorInfo?.uid || doctorInfo?.id || "",
          doctorName: doctorInfo ? `Dr. ${doctorInfo.first_name || ""} ${doctorInfo.last_name || ""}`.trim() : "",
          type: "contribution_before",
          description: `Consultation Contribution - $${amount}`,
          isTestMode: Boolean(isTestMode),
        }),
      });

      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId || "");
      } else {
        setErrorMessage(data.error || "Failed to initialize payment.");
      }
    } catch (e) {
      console.error("Error creating payment intent:", e);
      setErrorMessage("Failed to connect to payment server.");
    } finally {
      setLoadingIntent(false);
    }
  };

  const handlePayPalCheckout = async () => {
    if (paypalProcessing || !activeAmount) return;
    setPaypalProcessing(true);

    try {
      await startPayPalCheckout({
        amountCents: Math.round(activeAmount * 100),
        type: "contribution_before",
        isTestMode: Boolean(isTestMode),
        onSuccess: async ({ orderId }) => {
          await handlePaymentCompleted(orderId, "paypal");
          setPaypalProcessing(false);
        },
        onError: (err) => {
          console.error("PayPal error:", err);
          alert(err.message || "PayPal payment could not be completed.");
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

  const handlePaymentCompleted = async (paymentId, method = "card") => {
    setShowCheckoutModal(false);
    try {
      await recordContribution({
        user,
        amount: activeAmount,
        type: "before_consultation",
        paymentMethod: method,
        paymentId,
        doctorUid: doctorInfo?.uid || doctorInfo?.id || null,
        doctorName: doctorInfo ? `Dr. ${doctorInfo.first_name || ""} ${doctorInfo.last_name || ""}`.trim() : null,
      });

      if (activeAmount >= 20.0) {
        // Waived deposit! Schedule directly
        await onSuccessSchedule(paymentId, activeAmount);
      } else {
        // Amount < 20, proceed to standard $50 deposit
        onProceedToDeposit(paymentId, activeAmount);
      }
    } catch (err) {
      console.error("Error recording contribution:", err);
      alert("Contribution recorded. Finalizing appointment...");
      if (activeAmount >= 20.0) {
        await onSuccessSchedule(paymentId, activeAmount);
      } else {
        onProceedToDeposit(paymentId, activeAmount);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-white">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/80 hover:text-white mb-6 text-sm font-medium transition"
      >
        <ChevronLeftIcon className="w-5 h-5" />
        Back
      </button>

      {/* Header Tag & Title */}
      <div className="mb-8">
        <p className="text-[#D89B62] text-xs font-bold tracking-[0.2em] uppercase mb-2">
          ONE MORE STEP
        </p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
          Choose Your Contribution
        </h1>
        <p className="text-white/70 text-sm md:text-base leading-relaxed">
          You can join your consultation with{" "}
          <strong className="text-white font-semibold">
            whatever amount feels right to you
          </strong>
          . For those who pay the suggested amount, you'll be supporting our mission
          to make integrative care accessible to everyone — as our thanks, you'll
          receive the additions shown below.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 bg-red-950/60 border border-red-500/50 text-red-200 text-sm p-4 rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* Option 1: Suggested $149 */}
      <div className="bg-[#1E1E1E] rounded-3xl border border-white/10 p-6 md:p-8 mb-6 shadow-xl">
        <div className="text-center mb-6">
          <p className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase mb-1">
            OPTION 1
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white">
            Pay Suggested $149
          </h2>
          <hr className="border-white/10 my-5" />
        </div>

        <ul className="space-y-3.5 mb-8 text-sm md:text-base text-white/85">
          {[
            "Live video consultation with your integrative doctor",
            "Personalized diet, cleanse & lifestyle plan",
            "Unlimited text messaging with your doctor",
            "Priority booking for future appointments",
            "Extended consult, up to one hour",
            "Early access to private live sessions with expert & specialist guests",
          ].map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-[#FFD3AC] shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => handleStartContribution(149)}
          className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold py-4 rounded-full transition duration-200 text-lg shadow-lg flex items-center justify-center"
        >
          $149
        </button>
      </div>

      {/* Option 2: Pay As You Can */}
      <div className={`bg-[#1E1E1E] rounded-3xl border ${selectedOption === "option2" ? "border-[#FFD3AC]/40" : "border-white/10"} p-6 md:p-8 shadow-xl`}>
        <div className="text-center mb-4">
          <p className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase mb-1">
            OPTION 2
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-white">
            Pay As You Can
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Give whatever amount feels right to you.
          </p>
          <hr className="border-white/10 my-4" />
        </div>

        <ul className="space-y-3.5 mb-6 text-sm md:text-base text-white/85">
          {[
            "Live video consultation with your integrative doctor",
            "Personalized diet, cleanse & lifestyle plan",
            "Unlimited text messaging with your doctor",
          ].map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-[#FFD3AC] shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {selectedOption === "option2" ? (
          <div className="space-y-4">
            <div className="relative rounded-2xl bg-[#282828] border border-[#FFD3AC] px-4 py-3 flex items-center">
              <span className="text-[#FFD3AC] text-xl font-bold mr-2 select-none">$</span>
              <input
                type="number"
                min="1"
                step="any"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter your amount (e.g. 30, 50, 100)"
                className="w-full bg-transparent text-white text-base font-semibold border-none outline-none focus:outline-none focus:ring-0 ring-0 shadow-none appearance-none p-0 placeholder:text-white/35"
              />
            </div>

            <button
              type="button"
              onClick={() => handleStartContribution(Number(customAmount))}
              disabled={!customAmount || Number(customAmount) <= 0}
              className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold py-4 rounded-full transition duration-200 text-base shadow-lg disabled:opacity-50 tracking-wide uppercase"
            >
              {customAmount && Number(customAmount) > 0
                ? `CONTINUE WITH $${customAmount}`
                : "ENTER AMOUNT & CONTINUE"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSelectedOption("option2")}
            className="w-full bg-[#1E1E1E] hover:bg-white/5 border border-[#D89B62] text-white font-bold py-4 rounded-full transition duration-200 text-sm tracking-wider uppercase"
          >
            CHOOSE YOUR AMOUNT
          </button>
        )}

        <p className="text-white/60 text-xs text-center leading-relaxed mt-4">
          Contributions under $20 require a $50 deposit to hold your appointment. Fully refundable — cancel anytime from your bookings.
        </p>
      </div>

      {/* Footer Text */}
      <p className="font-serif italic text-white/50 text-center text-sm md:text-base mt-6">
        However much you're able to give is enough — wellness for everyone.
      </p>

      {/* Payment Selection Modal */}
      {showCheckoutModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCheckoutModal(false);
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
                  Total Contribution: ${activeAmount} USD
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="overflow-y-auto space-y-5 flex-1 pr-1 -mr-1 mt-4">
              {/* Method Tabs */}
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
                    <StripeContributionCheckoutForm
                      amount={activeAmount}
                      paymentIntentId={paymentIntentId}
                      user={user}
                      doctorInfo={doctorInfo}
                      onSuccess={(intentId) => handlePaymentCompleted(intentId, "card")}
                      onError={(err) => setErrorMessage(err)}
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
  );
}
