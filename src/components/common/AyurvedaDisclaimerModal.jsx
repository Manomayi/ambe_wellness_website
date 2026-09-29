"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  isBookingRoute,
  acknowledgeDisclaimer,
  DISCLAIMER_VERSION,
  DISCLAIMER_FIELD,
  DISCLAIMER_ACK_KEY,
  DISCLAIMER_LEGACY_KEY,
} from "@/lib/consent";

// Full-screen, one-time Ayurvedic Wellness agreement matching Flutter WellnessNoticePage.
// Shows when a user enters the consultation/scheduling flow (e.g. /user/consult/schedule).
// Cannot be dismissed without ticking the checkbox and clicking Continue.
// Persists acceptance to Firestore (`users/{uid}.ayurvedic_wellness_notice`) and localStorage.
export default function AyurvedaDisclaimerModal() {
  const pathname = usePathname();
  const { user, profile, userType, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Doctors never see the patient wellness notice
    if (userType === "doctor") {
      setOpen(false);
      return;
    }

    // Only consultation / booking routes show the disclaimer (e.g. /user/consult/schedule)
    if (!isBookingRoute(pathname)) {
      setOpen(false);
      return;
    }

    // While auth is still initializing, don't flash or make premature decisions
    if (authLoading) return;

    if (user?.uid) {
      // Authenticated user: Check their Firestore user profile (synced across App and Web)
      if (profile === undefined) return; // Wait until profile has resolved

      const record = profile?.[DISCLAIMER_FIELD];
      const hasAccepted =
        Boolean(record) &&
        record.accepted === true &&
        record.version === DISCLAIMER_VERSION;

      setOpen(!hasAccepted);
    } else {
      // Unauthenticated visitor check (device-level)
      const localAccepted =
        localStorage.getItem(DISCLAIMER_ACK_KEY) === DISCLAIMER_VERSION ||
        localStorage.getItem(DISCLAIMER_LEGACY_KEY) === "true";
      setOpen(!localAccepted);
    }
  }, [mounted, pathname, user, profile, userType, authLoading]);

  // Lock body scroll while the overlay is up
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const handleContinue = async () => {
    if (!agreed || saving) return;
    setSaving(true);
    try {
      if (user?.uid) {
        await setDoc(
          doc(db, "users", user.uid),
          {
            [DISCLAIMER_FIELD]: {
              accepted: true,
              version: DISCLAIMER_VERSION,
              accepted_at: serverTimestamp(),
            },
          },
          { merge: true }
        );
      }
      acknowledgeDisclaimer();
      setOpen(false);
    } catch (err) {
      console.error("Error saving ayurvedic wellness disclaimer:", err);
      // Fallback: still record locally and dismiss so user is not permanently trapped
      acknowledgeDisclaimer();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm select-none"
      role="dialog"
      aria-modal="true"
      aria-label="A Note About Ayurvedic Wellness"
    >
      <div className="relative w-full max-w-[520px] bg-[#1E1E1E] border border-white/10 rounded-2xl p-6 sm:p-8 my-auto shadow-2xl">
        {/* BEFORE YOU BEGIN */}
        <div className="text-xs font-semibold tracking-[0.16em] uppercase text-[#FFD3AC] font-sans">
          BEFORE YOU BEGIN
        </div>

        {/* Heading */}
        <h2 className="font-serif text-2xl sm:text-3xl font-medium sm:font-normal text-white mt-3 mb-5 leading-tight tracking-tight">
          A Note About<br />Ayurvedic Wellness
        </h2>

        {/* Informative paragraphs matching Flutter WellnessNoticePage */}
        <div className="space-y-4 text-sm sm:text-[15px] leading-relaxed text-white/70 font-sans">
          <p>
            Ambe’ connects you with practitioners trained in Ayurveda — one of the
            world’s oldest systems of traditional medicine, originating in India
            over 5,000 years ago.
          </p>
          <p>
            Our practitioners hold BAMS degrees from institutions accredited by
            India’s Central Council of Indian Medicine. Ayurveda is not a
            state-licensed medical practice in the United States.
          </p>
          <p>
            All programs, consultations, and products are for traditional wellness
            education and support. They are not intended to diagnose, treat, cure,
            or prevent any disease, and are not a substitute for a licensed
            physician.
          </p>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-white/10" />

        {/* Checkbox item */}
        <label className="flex items-start gap-3.5 cursor-pointer group select-none">
          <div className="relative flex items-center justify-center mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
            />
            <div
              className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${
                agreed
                  ? "bg-[#FFD3AC] border-[#FFD3AC] text-[#1E1E1E]"
                  : "bg-white/5 border-white/30 group-hover:border-white/50"
              }`}
            >
              {agreed && (
                <svg className="w-3.5 h-3.5 stroke-[2.5]" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm sm:text-[14px] leading-relaxed text-white/90 font-sans">
            I understand that Ambe’ provides traditional Ayurvedic wellness support, not licensed medical care, and is not a substitute for my primary care physician.
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!agreed || saving}
          className={`mt-6 w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 font-sans flex items-center justify-center gap-2 ${
            agreed && !saving
              ? "bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe2c7] shadow-lg cursor-pointer active:scale-[0.99]"
              : "bg-[#2D2D30] text-white/35 cursor-not-allowed border border-white/5"
          }`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
              <span>SAVING...</span>
            </>
          ) : (
            "I UNDERSTAND — CONTINUE"
          )}
        </button>

        {/* Footnote */}
        <p className="text-[11px] sm:text-xs text-white/40 text-center mt-3 font-sans">
          Confirmation required to continue
        </p>
      </div>
    </div>,
    document.body
  );
}
