"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AmbeBackButton from "@/components/common/AmbeBackButton";
import BackgroundVideo from "@/components/common/BackgroundVideo";

export default function BeginWellnessProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && profile?.is_free_questionnaire_completed) {
      router.replace("/user/home");
    }
  }, [profile, loading, router]);

  return (
    <div className="relative min-h-screen bg-[#1E1E1E] text-white flex flex-col justify-between overflow-x-hidden selection:bg-[#FFD3AC] selection:text-[#1E1E1E]">
      {/* Background Video matching Flutter mobile app */}
      <BackgroundVideo opacity={0.25} />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-xl mx-auto px-4 pt-3 sm:pt-5 pb-1 flex items-center justify-between">
        <AmbeBackButton onClick={() => router.push("/user/home")} />
        <h2 className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#FFD3AC] uppercase font-sans">
          BEFORE YOU BEGIN
        </h2>
        <div className="w-10" aria-hidden="true" />
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 w-full max-w-xl mx-auto px-5 sm:px-8 pt-2 pb-6 sm:pb-8 flex-1 flex flex-col justify-between">
        {/* Top Section */}
        <div className="flex-1 flex flex-col justify-start">
          {/* Category Header */}
          <p className="text-xs sm:text-sm font-semibold tracking-[0.18em] text-[#FFD3AC] uppercase font-sans mt-5 sm:mt-7 mb-3">
            YOUR WELLNESS PROFILE
          </p>

          {/* Hero Title */}
          <h1
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}
            className="text-3xl sm:text-4xl md:text-[42px] text-white font-semibold leading-[1.15] mb-5"
          >
            Let&apos;s get to know <br />
            <span className="italic font-normal">your </span>
            <span className="italic font-normal text-[#FFD3AC]">constitution</span>
          </h1>

          {/* Narrative Description - Only this paragraph has increased font size in mobile view */}
          <div className="text-white text-[18px] sm:text-base leading-[1.6] space-y-4 mb-6 font-sans font-normal">
            <p>
              To prepare for your personalized consultation, complete this quick
              questionnaire so we can understand your unique constitution.
            </p>
            <p>
              Your doctor will review your answers with you during your video consult,
              and you&apos;ll receive a personalized report with herbal, dietary, and
              movement guidance you can return to anytime.
            </p>
          </div>

          {/* Note / Callout Card */}
          <div className="rounded-2xl border border-[#FFD3AC]/70 bg-[#FFD3AC]/15 p-4 sm:p-5 mb-6 flex items-start gap-3">
            <span className="text-[#FFD3AC] text-sm select-none leading-tight mt-0.5">✦</span>
            <p className="text-[#FFD3AC] text-xs sm:text-[13.5px] font-medium leading-relaxed font-sans">
              There&apos;s no wrong answer — just choose whatever feels most true for you.
            </p>
          </div>
        </div>

        {/* Action Button & Time Estimate */}
        <div className="space-y-3 pt-2">
          <p className="text-xs text-white/60 text-center font-sans">
            Takes about 3 minutes
          </p>
          <button
            type="button"
            onClick={() => router.push("/user/menu/questionnaire")}
            className="w-full py-4 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full font-bold text-sm tracking-wider uppercase shadow-xl transition cursor-pointer"
          >
            BEGIN MY WELLNESS PROFILE
          </button>
        </div>
      </main>
    </div>
  );
}
