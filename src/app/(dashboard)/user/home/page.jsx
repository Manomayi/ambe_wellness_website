"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/common/ProtectedRoute";

export default function UserHomePage() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const isMember = Boolean(profile?.subscription?.active);
  const displayName = profile?.first_name || user?.displayName?.split(" ")[0] || "there";
  const isQuestionnaireCompleted = profile?.is_free_questionnaire_completed === true;
  const handleNextStepClick = () => {
    const hasDoctor = Boolean(profile?.doctor?.uid || profile?.doctor_uid);
    if (hasDoctor && !profile?.is_consultation_set) {
      router.push("/user/consult/schedule");
    } else {
      router.push("/user/consult");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <div className="w-full space-y-7 pb-10">
        {/* Top Greeting Section matching Flutter UserHomePage */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div>
            <h1
              className="text-[#FAF7F2] text-3xl sm:text-4xl font-medium tracking-tight"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Hello, {displayName}!
            </h1>
            <p className="text-[#B5AFA8] text-sm sm:text-base font-sans mt-1">
              How are you feeling today?
            </p>
          </div>

          {isMember && (
            <div className="px-3.5 py-1 rounded-full bg-[#FFD3AC]/20 border border-[#FFD3AC] text-[#FFD3AC] text-[11px] font-bold tracking-wider font-sans uppercase">
              MEMBER
            </div>
          )}
        </div>

        {/* YOUR NEXT STEP Card (Flutter _buildNextStepCard: content-fitted, left-aligned) */}
        <div className="flex justify-start">
          <div
            onClick={handleNextStepClick}
            className="
              inline-flex items-center justify-between gap-5 sm:gap-6
              bg-[#FFD3AC] text-[#1E1E1E] px-5 py-4 sm:px-5.5 sm:py-4.5 rounded-[26px]
              cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.99]
              select-none
            "
          >
            <div>
              <span className="text-[11px] font-semibold tracking-[1.2px] text-[#7D6553] uppercase font-sans">
                YOUR NEXT STEP
              </span>
              <h3
                className="text-lg sm:text-[19px] font-bold text-[#1E1E1E] mt-1 leading-tight"
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                }}
              >
                Book your consultation
              </h3>
              <p className="text-[13px] text-[#7D6553] font-sans mt-0.5">
                Meet your doctor over video
              </p>
            </div>

            {/* Black circle arrow */}
            <div className="w-10 h-10 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Made for you Section (Flutter _buildMadeForYouSection) */}
        <div className="space-y-3.5 pt-2">
          <h2
            className="text-xl sm:text-2xl font-normal italic text-[#FFD3AC]"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            }}
          >
            Made for you
          </h2>

          {/* Personalized Remedies Card */}
          <div
            onClick={() => router.push("/user/store")}
            className="
              bg-[#1B1A18]/65 border border-white/20 rounded-[22px] p-5 sm:p-6
              cursor-pointer transition-all duration-200 hover:border-[#FFD3AC]/60 hover:shadow-md
            "
          >
            <div className="inline-block px-3.5 py-1 rounded-full bg-[#FFD3AC] text-[#1E1E1E] text-[11px] font-bold tracking-wider font-sans uppercase mb-4">
              RECOMMENDED
            </div>

            <h3
              className="text-xl sm:text-2xl font-semibold text-[#F7F4EE] leading-snug mb-2"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Personalized remedies, made just for you
            </h3>

            <p className="text-[#B5AFA8] text-xs sm:text-[13.5px] font-sans leading-relaxed mb-4">
              Herbal protocols and wellness products chosen for your constitution.
            </p>

            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E59C5E] font-sans">
              <span>Explore the Shop</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Constitution Report Card (Flutter _buildMadeForYouSection - Card 2) */}
          <div
            onClick={() => {
              if (isQuestionnaireCompleted) {
                router.push("/user/menu/questionnaire/results");
              } else {
                router.push("/user/menu/questionnaire?returnToHome=true");
              }
            }}
            className="
              bg-[#1B1A18]/65 border border-white/20 rounded-[22px] p-5 sm:p-6
              cursor-pointer transition-all duration-200 hover:border-[#FFD3AC]/60 hover:shadow-md
              flex items-center justify-between gap-3
            "
          >
            <div className="flex-1">
              <h3
                className="text-lg sm:text-xl font-semibold text-[#F7F4EE]"
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                }}
              >
                {isQuestionnaireCompleted
                  ? "Your Constitution Report"
                  : "Complete Your Constitution Assessment"}
              </h3>
              <p className="text-[#B5AFA8] text-xs sm:text-[13px] font-sans leading-relaxed mt-1.5">
                {isQuestionnaireCompleted
                  ? "Review your personalized results and recommendations."
                  : "Complete your questionnaire to unlock your personalized constitution report."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isQuestionnaireCompleted && (
                <span className="px-2.5 py-1 rounded-full border border-[#CCA776] text-[#FFD3AC] text-[11px] font-bold tracking-widest font-sans uppercase">
                  READY
                </span>
              )}
              <svg
                className="w-5 h-5 text-[#B5AFA8]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Coming soon Section (Flutter _buildComingSoonSection) */}
        <div className="space-y-3.5 pt-2">
          <h2
            className="text-xl sm:text-2xl font-normal italic text-white"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            }}
          >
            Coming soon
          </h2>

          {/* Yoga & Meditation Classes Card */}
          <div
            onClick={() => router.push("/user/courses")}
            className="
              bg-[#1B1A18]/65 border border-white/20 rounded-[22px] p-5 sm:p-6
              cursor-pointer transition-all duration-200 hover:border-[#FFD3AC]/60 hover:shadow-md
            "
          >
            <div className="flex justify-end mb-2">
              <span className="px-2.5 py-1 rounded-full border border-[#FFD3AC] text-[#FFD3AC] text-[11px] font-bold tracking-widest font-sans uppercase">
                COMING SOON
              </span>
            </div>

            <h3
              className="text-2xl sm:text-3xl font-semibold text-[#F7F4EE] mb-3"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Yoga &amp; Meditation Classes
            </h3>

            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E59C5E] font-sans">
              <span>Start your journey</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Membership Card */}
          <div
            onClick={() => router.push("/user/membership")}
            className="
              bg-[#1B1A18]/65 border border-white/20 rounded-[22px] p-5 sm:p-6
              cursor-pointer transition-all duration-200 hover:border-[#FFD3AC]/60 hover:shadow-md
            "
          >
            <div className="flex justify-end mb-2">
              <span className="px-2.5 py-1 rounded-full border border-[#FFD3AC] text-[#FFD3AC] text-[11px] font-bold tracking-widest font-sans uppercase">
                COMING SOON
              </span>
            </div>

            <h3
              className="text-2xl sm:text-3xl font-semibold text-[#F7F4EE] mb-3"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Membership
            </h3>

            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E59C5E] font-sans">
              <span>Quality holistic care, for everyone</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

