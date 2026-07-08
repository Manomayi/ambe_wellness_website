"use client";
import React from "react";
import { createPortal } from "react-dom";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Integration point — wire up real email delivery + mailing-list provider here.
export async function submitEmailCapture(email, { guideTitle } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { ok: true, email, guideTitle };
}

export default function EmailCaptureModal({ open, onClose, guideTitle }) {
  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (open) {
      setEmail("");
      setError("");
      setSubmitting(false);
      setSuccess(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitEmailCapture(email.trim(), { guideTitle });
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "rgba(26, 26, 26, 0.55)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get your free Ambé guides"
        className="relative w-full max-w-[520px] rounded-2xl sm:rounded-3xl px-6 py-8 sm:px-10 sm:py-10 text-center shadow-2xl"
        style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 flex items-center justify-center rounded-full text-xl leading-none cursor-pointer hover:bg-[#F4F4F4] transition-colors"
          style={{ color: "#6b6862" }}
        >
          ×
        </button>

        {success ? (
          <div className="py-4 sm:py-6">
            <div
              className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full text-2xl font-semibold"
              style={{ backgroundColor: "#FFD3AC", color: "#353535" }}
            >
              ✓
            </div>
            <h2
              className="text-2xl sm:text-[28px] leading-tight font-medium mb-3 select-none"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1a1a1a" }}
            >
              Check your inbox!
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#535353" }}>
              {guideTitle
                ? `“${guideTitle}” is on its way to ${email.trim()}.`
                : `Your Ambé guide library is on its way to ${email.trim()}.`}
            </p>
          </div>
        ) : (
          <>
            {guideTitle ? (
              <h2
                className="text-2xl sm:text-[28px] leading-tight font-medium mb-3 px-6 select-none"
                style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1a1a1a" }}
              >
                {guideTitle}
              </h2>
            ) : (
              <h2
                className="text-2xl sm:text-[32px] leading-tight font-medium mb-3 px-2 select-none"
                style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1a1a1a" }}
              >
                <span style={{ color: "#C8996A" }}>8</span> Expert Guides.{" "}
                <em className="italic" style={{ color: "#C8996A" }}>
                  Yours Free.
                </em>
              </h2>
            )}

            <p
              className="text-sm sm:text-[15px] mb-7 max-w-md mx-auto leading-relaxed"
              style={{ color: "#535353" }}
            >
              {guideTitle
                ? "Enter your email and we'll send this guide straight to your inbox."
                : "Enter your email and we'll send the full Ambé guide library to your inbox."}
            </p>

            <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-3" noValidate>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Your email address"
                autoFocus
                className="w-full px-5 py-3.5 rounded-full border text-sm outline-none transition-colors focus:border-[#C8996A]"
                style={{
                  borderColor: "#E7E2D9",
                  color: "#1a1a1a",
                  backgroundColor: "#fff",
                }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3.5 rounded-full text-xs sm:text-[13px] font-medium tracking-[0.14em] uppercase transition-all duration-200 bg-[#FFD3AC] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Sending…"
                  : guideTitle
                    ? "Send My Guide"
                    : "Send My Free Guides"}
              </button>
            </form>

            {error && (
              <p className="mt-3 text-sm" style={{ color: "#C0392B" }}>
                {error}
              </p>
            )}

            <p className="mt-5 text-xs leading-relaxed" style={{ color: "#9A948B" }}>
              No spam — just your guides. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
