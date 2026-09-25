"use client";

import React from "react";
import BackgroundVideo from "@/components/common/BackgroundVideo";

export default function ProfileCreationAnimation() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#141416] overflow-hidden select-none">
      {/* Background Video */}
      <BackgroundVideo
        videoSrc="/videos/opening_page_background.mp4"
        posterSrc="/images/background/magnolia_flowers.jpg"
        opacity={0.35}
      />

      {/* Dark Gradient Overlay matching Flutter */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 to-black/60 pointer-events-none" />

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto">
        {/* Pulsating ring and leaf logo */}
        <div className="relative flex items-center justify-center mb-6 w-[150px] h-[150px]">
          {/* Pulsating Ring (matches Flutter .scaleXY(0.8 -> 1.5) .fade(1.0 -> 0.0) 2s easeOut) */}
          <div
            className="absolute w-[140px] h-[140px] rounded-full border-[3px] border-[#FFD3AC]/70 pointer-events-none"
            style={{
              animation: "profilePulseRing 2s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />

          {/* Leaf Logo Image */}
          <img
            src="/images/logos/leaf_bg.png"
            alt="Ambe Logo"
            className="w-[100px] h-[100px] object-contain relative z-10 drop-shadow-md select-none"
          />
        </div>

        {/* Title matching Flutter displayTextSemiBold (Cormorant Garamond 24px) */}
        <h2
          className="font-heading text-2xl sm:text-[28px] font-semibold text-white tracking-wide mb-2.5 drop-shadow"
          style={{
            animation: "profileFadeSlide 1s ease-out forwards",
          }}
        >
          Creating your profile
        </h2>

        {/* Subtitle matching Flutter bodyRegular (Jost 16px) */}
        <p
          className="font-sans text-base text-white/90 leading-relaxed max-w-sm"
          style={{
            animation: "profileFadeIn 0.9s ease-out 0.15s both",
          }}
        >
          Tailoring your Ambe experience just for you.
        </p>
      </div>

      {/* CSS Keyframes matching Flutter animate() curves */}
      <style>{`
        @keyframes profilePulseRing {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes profileFadeSlide {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes profileFadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
