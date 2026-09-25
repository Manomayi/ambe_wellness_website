"use client";

import React from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";

export default function PaymentMethodSelector({
  selectedMethod = "stripe",
  onSelectMethod,
  isTestMode = false,
  disabled = false,
  labelClassName = "text-white",
  dark = true,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-semibold ${labelClassName}`}>
          Select Payment Method
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Stripe Card Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectMethod("stripe")}
          className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[72px] ${
            selectedMethod === "stripe"
              ? dark
                ? "border-[#FFD3AC] bg-[#FFD3AC]/10 shadow-sm"
                : "border-[#1A1A1A] bg-[#FFF9F2] shadow-sm"
              : dark
                ? "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                : "border-[#E7E2D9] bg-white hover:border-[#C8996A] hover:bg-[#FAF8F5]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                selectedMethod === "stripe"
                  ? dark
                    ? "bg-[#FFD3AC] text-[#1E1E1E]"
                    : "bg-[#1A1A1A] text-[#FFD3AC]"
                  : dark
                    ? "bg-white/10 text-white/80 border border-white/15"
                    : "bg-[#FAF8F5] text-[#1A1A1A] border border-[#E7E2D9]"
              }`}
            >
              <CreditCardIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm leading-snug ${dark ? "text-white" : "text-[#1A1A1A]"}`}>
                Credit / Debit Card
              </p>
            </div>
          </div>

          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
              selectedMethod === "stripe"
                ? dark
                  ? "border-[#FFD3AC] bg-[#FFD3AC]"
                  : "border-[#1A1A1A] bg-[#1A1A1A]"
                : dark
                  ? "border-white/30"
                  : "border-[#8C827A]"
            }`}
          >
            {selectedMethod === "stripe" && (
              <div className={`w-1.5 h-1.5 rounded-full ${dark ? "bg-[#1E1E1E]" : "bg-white"}`} />
            )}
          </div>
        </button>

        {/* Apple Pay Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectMethod("apple_pay")}
          className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[72px] ${
            selectedMethod === "apple_pay"
              ? dark
                ? "border-[#FFD3AC] bg-[#FFD3AC]/10 shadow-sm"
                : "border-[#1A1A1A] bg-[#FFF9F2] shadow-sm"
              : dark
                ? "border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10"
                : "border-[#E7E2D9] bg-white hover:border-[#C8996A] hover:bg-[#FAF8F5]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                selectedMethod === "apple_pay"
                  ? dark
                    ? "bg-[#FFD3AC] text-[#1E1E1E]"
                    : "bg-[#1A1A1A] text-white"
                  : dark
                    ? "bg-white/10 text-white border border-white/15"
                    : "bg-[#FAF8F5] text-[#1A1A1A] border border-[#E7E2D9]"
              }`}
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm leading-snug ${dark ? "text-white" : "text-[#1A1A1A]"}`}>
                Apple Pay
              </p>
            </div>
          </div>

          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
              selectedMethod === "apple_pay"
                ? dark
                  ? "border-[#FFD3AC] bg-[#FFD3AC]"
                  : "border-[#1A1A1A] bg-[#1A1A1A]"
                : dark
                  ? "border-white/30"
                  : "border-[#8C827A]"
            }`}
          >
            {selectedMethod === "apple_pay" && (
              <div className={`w-1.5 h-1.5 rounded-full ${dark ? "bg-[#1E1E1E]" : "bg-white"}`} />
            )}
          </div>
        </button>

        {/* PayPal Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectMethod("paypal")}
          className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between min-h-[72px] ${
            selectedMethod === "paypal"
              ? dark
                ? "border-[#0070BA] bg-[#0070BA]/20 shadow-sm"
                : "border-[#0070BA] bg-[#F4F9FF] shadow-sm"
              : dark
                ? "border-white/10 bg-white/5 hover:border-[#0070BA]/50 hover:bg-white/10"
                : "border-[#E7E2D9] bg-white hover:border-[#0070BA]/50 hover:bg-[#FAF8F5]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0 ${
                selectedMethod === "paypal"
                  ? "bg-[#0070BA] text-white"
                  : dark
                    ? "bg-white/10 text-[#0070BA] border border-white/15"
                    : "bg-[#FAF8F5] text-[#003087] border border-[#E7E2D9]"
              }`}
            >
              <span className="font-serif italic tracking-tighter">P</span>
            </div>
            <div className="min-w-0">
              <p className={`font-semibold text-sm leading-snug ${dark ? "text-white" : "text-[#1A1A1A]"}`}>
                PayPal
              </p>
            </div>
          </div>

          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 ${
              selectedMethod === "paypal"
                ? "border-[#0070BA] bg-[#0070BA]"
                : dark
                  ? "border-white/30"
                  : "border-[#8C827A]"
            }`}
          >
            {selectedMethod === "paypal" && (
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
