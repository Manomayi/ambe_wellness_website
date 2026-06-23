import React from "react";
import Link from "next/link";
import ShopHeader from "@/components/shop/ShopHeader";

export const metadata = {
  title: "Order Confirmed — Ambé Wellness",
  description: "Thank you for your order.",
};

const ACCENT = "#C8996A";
const SERIF = "'Cormorant Garamond', serif";

// Confirmation page shown after a successful Stripe Checkout.
export default function ShopSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ShopHeader />

      <section className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-xl w-full text-center">
          {/* Check mark */}
          <div
            className="w-16 h-16 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#FFD3AC" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2E2E2E" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div
            className="text-xs font-medium tracking-[0.25em] uppercase mb-4"
            style={{ color: ACCENT }}
          >
            Order Confirmed
          </div>
          <h1
            className="text-4xl sm:text-5xl mb-5"
            style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
          >
            Thank you for your order
          </h1>
          <p className="text-base mb-10 leading-relaxed" style={{ color: "#6B6B6B" }}>
            You&apos;ll receive a confirmation email shortly. Your products will
            ship within 3–5 business days.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="px-8 py-3 rounded-full text-xs sm:text-sm font-medium tracking-[0.18em] uppercase text-center transition-all duration-200 bg-[#FFD3AC] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white"
            >
              Continue Shopping
            </Link>
            <Link
              href="/membership"
              className="px-8 py-3 rounded-full text-xs sm:text-sm font-medium tracking-[0.18em] uppercase text-center transition-all duration-200 border border-[#2E2E2E] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white"
            >
              Book Free Consult
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
