"use client";

import React from "react";

export default function PaymentProcessingOverlay({
  title = "Processing Payment",
  subtitle = "Please wait...",
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1E1E1E] select-none text-center px-4">
      {/* Pulsing Icon - Exactly matches Flutter PaymentProcessingOverlay */}
      <div className="relative flex items-center justify-center">
        <div
          className="w-[100px] h-[100px] rounded-full border-2 border-[#FFD3AC] flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: "rgba(255, 211, 172, 0.2)",
            animation: "pulseScale 2s ease-in-out infinite",
          }}
        >
          {/* Material Icons 'payment' matching Flutter Icons.payment */}
          <svg
            className="w-[50px] h-[50px] text-[#FFD3AC]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        </div>
      </div>

      <div className="h-[30px]" />

      {/* Title */}
      <h2 className="text-[24px] font-bold text-white tracking-wide font-sans">
        {title}
      </h2>

      <div className="h-[10px]" />

      {/* Subtitle */}
      <p className="text-[16px] text-[#9E9E9E] font-sans">
        {subtitle}
      </p>

      <div className="h-[30px]" />

      {/* Indeterminate LinearProgressIndicator matching Flutter */}
      <div className="w-[200px] h-[4px] bg-[#2D2D30] rounded-full overflow-hidden relative">
        <div
          className="h-full bg-[#FFD3AC] rounded-full"
          style={{
            animation: "linearProgress 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes pulseScale {
          0%, 100% {
            transform: scale(0.9);
          }
          50% {
            transform: scale(1.1);
          }
        }
        @keyframes linearProgress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 70%;
            margin-left: 20%;
          }
          100% {
            width: 30%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}
