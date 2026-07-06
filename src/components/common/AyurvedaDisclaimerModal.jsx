"use client";
import React from "react";
import { createPortal } from "react-dom";
import { isDisclaimerSatisfied, acknowledgeDisclaimer } from "@/lib/consent";

// Ayurveda Disclaimer Modal (item 68): full-screen overlay shown once on first
// visit. The continue button stays disabled until the checkbox is checked.
// Acknowledgement is remembered in localStorage (ambe_disclaimer_v1) and gates
// the cookie banner + 8-second email modal.
export default function AyurvedaDisclaimerModal() {
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (!isDisclaimerSatisfied()) setOpen(true);
  }, []);

  // Lock body scroll while the overlay is up.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  const handleContinue = () => {
    if (!agreed) return;
    acknowledgeDisclaimer();
    setOpen(false);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      role="dialog"
      aria-modal="true"
      aria-label="A note about Ayurvedic wellness"
    >
      <div className="relative w-full max-w-xl bg-white rounded-lg p-8 sm:p-10 my-8">
        <div
          className="text-xs font-semibold tracking-widest uppercase mb-3"
          style={{ color: "#C2691C" }}
        >
          Before You Begin
        </div>
        <div
          className="font-heading text-2xl sm:text-3xl font-medium mb-5 leading-tight"
          style={{ color: "#353535" }}
        >
          A Note About Ayurvedic Wellness
        </div>

        <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: "#353535" }}>
          <p>
            Ambé connects you with practitioners trained in Ayurveda — one of the
            world&apos;s oldest systems of traditional medicine, originating in
            India over 5,000 years ago.
          </p>
          <p>
            Our practitioners hold BAMS degrees from institutions accredited by
            India&apos;s Central Council of Indian Medicine. Ayurveda is not a
            state-licensed medical practice in the United States.
          </p>
          <p>
            All programs, consultations, and products are for traditional wellness
            education and support. They are not intended to diagnose, treat, cure,
            or prevent any disease, and are not a substitute for a licensed
            physician.
          </p>
        </div>

        <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer accent-[#FFD3AC]"
            />
            <span className="text-sm leading-relaxed" style={{ color: "#535353" }}>
              I understand that Ambé provides traditional Ayurvedic wellness
              support, not licensed medical care, and is not a substitute for my
              primary care physician.
            </span>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!agreed}
            aria-disabled={!agreed}
            className={
              "mt-5 w-full py-3 rounded-md text-sm font-semibold tracking-wider uppercase transition-all duration-200 " +
              (agreed ? "cursor-pointer" : "cursor-not-allowed")
            }
            style={
              agreed
                ? { backgroundColor: "#FFD3AC", color: "#353535" }
                : { backgroundColor: "#E5E5E5", color: "#9A9A9A" }
            }
          >
            I Understand — Continue to Ambé
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
