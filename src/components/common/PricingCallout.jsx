"use client";
import React from "react";
import Link from "next/link";

export default function PricingCallout() {
  return (
    <section className="w-full" style={{ backgroundColor: "#353535" }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-10 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
          {/* Text */}
          <div>
            <div
              className="text-2xl sm:text-3xl font-medium mb-2 sm:whitespace-nowrap"
              style={{ color: "white", fontFamily: "Richmond" }}
            >
              Membership starts at $50/month.
            </div>
            <p
              className="text-sm sm:text-base"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              Everything included — consultations, medicines, unlimited
              messaging.
            </p>
          </div>

          {/* Buttons — stack below text on mobile */}
          <div className="flex flex-col gap-3 w-full sm:w-auto md:flex-shrink-0">
            <Link
              href="/membership"
              className="px-8 py-3 rounded-full text-sm font-medium tracking-wider uppercase text-center transition-all duration-200 bg-[#FFD3AC] text-[#353535] hover:bg-white"
            >
              View Membership Plans
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3 rounded-full text-sm font-medium tracking-wider uppercase text-center transition-all duration-200 border border-[#FFD3AC] hover:bg-[#FFD3AC] hover:text-[#353535]"
              style={{ color: "#FFD3AC" }}
            >
              Book Free Consult
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
