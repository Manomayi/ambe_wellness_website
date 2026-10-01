"use client";

import { useState, useEffect } from "react";
import { CheckIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { startPayPalCheckout } from "@/lib/paypal";
import { recordContribution } from "@/lib/contributionService";
import PaymentProcessingOverlay from "@/components/common/PaymentProcessingOverlay";

function ContributionApplePayForm({
  amount,
  paymentIntentId,
  user,
  doctorInfo,
  onSuccess,
  onError,
  onProcessingChange,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(true);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    if (onProcessingChange) onProcessingChange(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        if (onError) onError(submitError.message);
        setProcessing(false);
        if (onProcessingChange) onProcessingChange(false);
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (result.error) {
        if (onError) onError(result.error.message || "Apple Pay payment failed.");
        setProcessing(false);
        if (onProcessingChange) onProcessingChange(false);
      } else if (
        result.paymentIntent &&
        (result.paymentIntent.status === "succeeded" ||
          result.paymentIntent.status === "processing")
      ) {
        const intentId = result.paymentIntent.id || paymentIntentId;
        await onSuccess(intentId);
      } else {
        if (onError) onError("Payment was not completed.");
        setProcessing(false);
        if (onProcessingChange) onProcessingChange(false);
      }
    } catch (err) {
      console.error("Apple Pay confirm error:", err);
      if (onError) onError("Payment failed. Please try again.");
      setProcessing(false);
      if (onProcessingChange) onProcessingChange(false);
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
            applePay: "always",
            googlePay: "never",
          },
          buttonType: {
            applePay: "plain",
          },
          buttonTheme: {
            applePay: "white",
          },
          buttonHeight: 48,
        }}
      />

      {processing && (
        <div className="text-center py-2 text-xs text-white/60">
          Processing Apple Pay...
        </div>
      )}
    </div>
  );
}

function StripeContributionCheckoutForm({
  amount,
  paymentIntentId,
  user,
  doctorInfo,
  onSuccess,
  onError,
  onProcessingChange,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    if (onProcessingChange) onProcessingChange(true);
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
        if (onProcessingChange) onProcessingChange(false);
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
        if (onProcessingChange) onProcessingChange(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setErrorMsg("Payment could not be confirmed. Please try again.");
      setProcessing(false);
      if (onProcessingChange) onProcessingChange(false);
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
  const [selectedPreset, setSelectedPreset] = useState(99);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustomFocused, setIsCustomFocused] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' | 'apple_pay' | 'paypal'
  const [activeAmount, setActiveAmount] = useState(149);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showUnder49Modal, setShowUnder49Modal] = useState(false);
  const [pendingUnder49Amount, setPendingUnder49Amount] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [canUseApplePay, setCanUseApplePay] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const isAppleDevice = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent || "");
      const hasApplePay = !!window.ApplePaySession;
      setCanUseApplePay(isAppleDevice && hasApplePay);
    }
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCheckoutModal || showUnder49Modal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCheckoutModal, showUnder49Modal]);

  const handleStartContribution = async (amount) => {
    if (!amount || amount <= 0) {
      setErrorMessage("Please enter a valid contribution amount.");
      return;
    }
    if (!selectedSlot?.isInstant && selectedSlot?.time && selectedSlot.time.getTime() < Date.now() + 5 * 60 * 1000) {
      setErrorMessage("This time slot has expired while waiting. Please go back and select a new time slot.");
      return;
    }
    if (amount < 49) {
      setPendingUnder49Amount(amount);
      setShowUnder49Modal(true);
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
    if (!selectedSlot?.isInstant && selectedSlot?.time && selectedSlot.time.getTime() < Date.now() + 5 * 60 * 1000) {
      alert("This time slot has expired while waiting. Please go back and select a new time slot.");
      return;
    }
    setPaypalProcessing(true);

    try {
      await startPayPalCheckout({
        amountCents: Math.round(activeAmount * 100),
        type: "contribution_before",
        isTestMode: Boolean(isTestMode),
        onSuccess: async ({ orderId }) => {
          setIsProcessingPayment(true);
          await handlePaymentCompleted(orderId, "paypal");
          setPaypalProcessing(false);
        },
        onError: (err) => {
          console.error("PayPal error:", err);
          alert(err.message || "PayPal payment could not be completed.");
          setPaypalProcessing(false);
          setIsProcessingPayment(false);
        },
        onCancel: () => {
          setPaypalProcessing(false);
          setIsProcessingPayment(false);
        },
      });
    } catch (e) {
      console.error("PayPal flow error:", e);
      setPaypalProcessing(false);
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentCompleted = async (paymentId, method = "card") => {
    setShowCheckoutModal(false);
    setIsProcessingPayment(true);
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

      // Contribution completed (>= $49): deposit waived! Schedule directly.
      await onSuccessSchedule(paymentId, activeAmount);
    } catch (err) {
      console.error("Error recording contribution:", err);
      await onSuccessSchedule(paymentId, activeAmount);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-white">
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
            "Live video consultation with your integrative practitioner",
            "Personalized diet, cleanse & lifestyle plan",
            "Unlimited text messaging with your practitioner",
            "Priority booking for future appointments",
            "Extended consult, up to one hour",
            "Early access to private live sessions with practitioner & specialist guests",
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
      <div className="bg-[#1E1E1E] rounded-3xl border border-white/10 p-6 md:p-8 shadow-xl">
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
            "Live video consultation with your integrative practitioner",
            "Personalized diet, cleanse & lifestyle plan",
            "Unlimited text messaging with your practitioner",
          ].map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckIcon className="w-5 h-5 text-[#FFD3AC] shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Quick Chips: +$49, +$99, +$149 */}
        <div className="grid grid-cols-3 gap-3 mb-3.5">
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
                    ? "bg-[#282828] border-[#FFD3AC] text-[#FFD3AC] border-[1.5px]"
                    : "bg-[#282828] border-white/10 text-white hover:border-white/20"
                }`}
              >
                +${amt}
              </button>
            );
          })}
        </div>

        {/* Custom Amount Input Field */}
        <div
          className={`rounded-2xl bg-[#282828] border px-4 py-3.5 flex items-center mb-5 transition ${
            !selectedPreset && (isCustomFocused || customAmount)
              ? "border-[#FFD3AC] border-[1.5px]"
              : "border-white/10"
          }`}
        >
          <span
            className={`text-lg font-bold mr-2 select-none ${
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
            className="w-full bg-transparent text-white text-base font-semibold border-none outline-none focus:outline-none focus:ring-0 ring-0 shadow-none appearance-none p-0 placeholder:text-white/35"
          />
        </div>

        {/* Dynamic Action Button */}
        <button
          type="button"
          onClick={() => {
            const effectiveAmt =
              selectedPreset !== null
                ? selectedPreset
                : (customAmount ? Number(customAmount) : null);
            if (!effectiveAmt || effectiveAmt <= 0) {
              setErrorMessage("Please enter a valid contribution amount.");
              return;
            }
            handleStartContribution(effectiveAmt);
          }}
          disabled={
            selectedPreset === null && (!customAmount || Number(customAmount) <= 0)
          }
          className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold py-4 rounded-full transition duration-200 text-base shadow-lg disabled:opacity-50 tracking-wide uppercase"
        >
          {selectedPreset !== null
            ? `CONTINUE WITH $${selectedPreset}`
            : (customAmount && Number(customAmount) > 0
                ? `CONTINUE WITH $${customAmount}`
                : "ENTER AMOUNT & CONTINUE")}
        </button>

        <p className="text-white/60 text-xs text-center leading-relaxed mt-4">
          Contributions under $49 require a $50 deposit to hold your appointment. Fully refundable — cancel anytime from your bookings.
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
                {canUseApplePay && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("apple_pay")}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-1.5 ${
                      paymentMethod === "apple_pay"
                        ? "bg-[#FFD3AC] text-black font-semibold"
                        : "bg-[#282828] text-white/70 hover:text-white"
                    }`}
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 384 512">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </svg>
                    Apple Pay
                  </button>
                )}
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

              {paymentMethod === "apple_pay" ? (
                loadingIntent || !clientSecret ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-3 text-white/70">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-[#FFD3AC]" />
                    <p className="text-sm">Preparing Apple Pay...</p>
                  </div>
                ) : (
                  <div className="bg-[#242427] border border-white/15 rounded-2xl p-6 shadow-xl space-y-4">
                    <h4 className="font-serif text-xl font-bold text-white">Apple Pay</h4>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "night",
                          variables: {
                            colorPrimary: "#FFD3AC",
                            colorBackground: "#242427",
                            colorText: "#ffffff",
                          },
                        },
                      }}
                    >
                      <ContributionApplePayForm
                        amount={activeAmount}
                        paymentIntentId={paymentIntentId}
                        user={user}
                        doctorInfo={doctorInfo}
                        onSuccess={(intentId) => handlePaymentCompleted(intentId, "apple_pay")}
                        onError={(err) => setErrorMessage(err)}
                        onProcessingChange={setIsProcessingPayment}
                      />
                    </Elements>
                    <p className="text-white/40 text-xs text-center">
                      Your payment information is encrypted and secured by Stripe.
                    </p>
                  </div>
                )
              ) : paymentMethod === "card" ? (
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
                      onProcessingChange={setIsProcessingPayment}
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

      {/* Under-$49 Combined Payment Notice Modal */}
      {showUnder49Modal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md overflow-y-auto flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowUnder49Modal(false)}
        >
          <div
            className="bg-[#1E1E1E] border border-[#FFD3AC]/30 rounded-t-3xl sm:rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl font-bold text-[#FFD3AC]">
              Refundable Deposit Required
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Contributions under $49 require a $50 refundable deposit to hold your appointment. The deposit is fully refundable within 30 days.
            </p>
            
            <div className="bg-[#282828] border border-white/10 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Contribution:</span>
                <span className="font-bold text-white">${Number(pendingUnder49Amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Refundable Deposit:</span>
                <span className="font-bold text-white">$50.00</span>
              </div>
              <div className="border-t border-white/15 pt-2 flex justify-between font-bold text-sm text-[#FFD3AC]">
                <span>Total:</span>
                <span>${(Number(pendingUnder49Amount || 0) + 50).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnder49Modal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white/70 hover:text-white font-medium text-xs uppercase tracking-wider transition"
              >
                Change Amount
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = pendingUnder49Amount;
                  setShowUnder49Modal(false);
                  onProceedToDeposit(amt);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] font-bold text-xs uppercase tracking-wider transition shadow-lg"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Payment Processing Overlay matching mobile app */}
      {isProcessingPayment && (
        <PaymentProcessingOverlay />
      )}
    </div>
  );
}
