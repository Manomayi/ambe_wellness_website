"use client";

import React from "react";
import { CreditCardIcon } from "@heroicons/react/24/outline";

export default function PaymentMethodSelector({
  selectedMethod = "stripe",
  onSelectMethod,
  isTestMode = false,
  disabled = false,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-[#1A1A1A]">
          Select Payment Method
        </label>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Stripe Card Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectMethod("stripe")}
          className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedMethod === "stripe"
              ? "border-[#1A1A1A] bg-[#FFF9F2] shadow-sm"
              : "border-[#E7E2D9] bg-white hover:border-[#C8996A] hover:bg-[#FAF8F5]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === "stripe"
                    ? "bg-[#1A1A1A] text-[#FFD3AC]"
                    : "bg-[#FAF8F5] text-[#1A1A1A] border border-[#E7E2D9]"
                }`}
              >
                <CreditCardIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1A1A1A]">
                  Credit / Debit Card
                </p>
                <p className="text-xs text-[#6B6862]">Secure via Stripe</p>
              </div>
            </div>

            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1 ${
                selectedMethod === "stripe"
                  ? "border-[#1A1A1A] bg-[#1A1A1A]"
                  : "border-[#8C827A]"
              }`}
            >
              {selectedMethod === "stripe" && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#8C827A] uppercase font-medium">
            <span className="px-1.5 py-0.5 bg-white border border-[#E7E2D9] rounded">Visa</span>
            <span className="px-1.5 py-0.5 bg-white border border-[#E7E2D9] rounded">Mastercard</span>
            <span className="px-1.5 py-0.5 bg-white border border-[#E7E2D9] rounded">Amex</span>
          </div>
        </button>

        {/* PayPal Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSelectMethod("paypal")}
          className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedMethod === "paypal"
              ? "border-[#0070BA] bg-[#F4F9FF] shadow-sm"
              : "border-[#E7E2D9] bg-white hover:border-[#0070BA]/50 hover:bg-[#FAF8F5]"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                  selectedMethod === "paypal"
                    ? "bg-[#003087] text-white"
                    : "bg-[#FAF8F5] text-[#003087] border border-[#E7E2D9]"
                }`}
              >
                <span className="font-serif italic tracking-tighter">P</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-[#1A1A1A]">PayPal</p>
                <p className="text-xs text-[#6B6862]">PayPal or Credit</p>
              </div>
            </div>

            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-1 ${
                selectedMethod === "paypal"
                  ? "border-[#0070BA] bg-[#0070BA]"
                  : "border-[#8C827A]"
              }`}
            >
              {selectedMethod === "paypal" && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#003087] font-medium">
            <span className="px-1.5 py-0.5 bg-white border border-[#E7E2D9] rounded">PayPal Checkout</span>
          </div>
        </button>
      </div>
    </div>
  );
}
