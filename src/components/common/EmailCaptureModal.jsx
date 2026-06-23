"use client";
import React from "react";
import { createPortal } from "react-dom";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Integration point — wire up real email delivery + mailing-list provider here.
export async function submitEmailCapture(email, { guideTitle } = {}) {
  // TODO: deliver guides by email and add the address to the mailing list.
  // For now we simulate the network round-trip and resolve successfully.
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

  // Reset transient state each time the modal is opened.
  React.useEffect(() => {
    if (open) {
      setEmail("");
      setError("");
      setSubmitting(false);
      setSuccess(false);
    }
  }, [open]);

  // Close on Escape + lock body scroll while open.
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Get your free Ambé guides"
        className="relative w-full max-w-lg bg-white rounded-lg p-8 sm:p-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-2xl leading-none cursor-pointer hover:opacity-70"
          style={{ color: "#353535" }}
        >
          ×
        </button>

        {success ? (
          <div className="py-6">
            <div
              className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full text-2xl"
              style={{ backgroundColor: "#FFD3AC", color: "#353535" }}
            >
              ✓
            </div>
            <div
              className="text-2xl sm:text-3xl font-medium mb-2"
              style={{ color: "#353535", fontFamily: "Richmond" }}
            >
              Check your inbox!
            </div>
            <p className="text-sm sm:text-base" style={{ color: "#535353" }}>
              {guideTitle
                ? `“${guideTitle}” is on its way to ${email.trim()}.`
                : `Your Ambé guide library is on its way to ${email.trim()}.`}
            </p>
          </div>
        ) : (
          <>
            <div
              className="text-2xl sm:text-3xl font-medium mb-3"
              style={{ color: "#353535", fontFamily: "Richmond" }}
            >
              {guideTitle ? guideTitle : "8 Expert Guides. Yours Free."}
            </div>
            <p
              className="text-sm sm:text-base mb-6 max-w-md mx-auto"
              style={{ color: "#535353" }}
            >
              {guideTitle
                ? "Enter your email and we’ll send this guide straight to your inbox."
                : "Enter your email and we’ll send the full Ambé guide library to your inbox."}
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              noValidate
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Your email address"
                autoFocus
                className="flex-1 px-4 py-3 rounded-md border focus:outline-none focus:ring-2 text-sm"
                style={{ borderColor: "#D0D0D0", color: "#353535" }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-md text-sm font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Send My Free Guides"}
              </button>
            </form>
            {error && (
              <p className="mt-3 text-sm" style={{ color: "#C0392B" }}>
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
