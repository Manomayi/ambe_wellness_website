"use client";

import React from "react";
import Image from "next/image";
import { submitEmailCapture } from "@/components/common/EmailCaptureModal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResourcesStarterGuide() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitEmailCapture(email.trim(), {
        guideTitle: "Ambé Wellness Starter Guide",
      });
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-ambe-cream py-14 sm:py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="relative aspect-[3/4] max-w-sm mx-auto lg:mx-0 w-full bg-[#E8E3DA] overflow-hidden">
            <Image
              src="/images/education/precision_formula.png"
              alt="Ambé Wellness Starter Guide"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 80vw, 400px"
            />
          </div>

          <div className="bg-ambe-dark px-8 sm:px-10 py-10 sm:py-12">
            <p className="text-xs tracking-[0.25em] uppercase text-ambe-gold mb-4 font-medium">
              Free Resource
            </p>

            <h2 className="font-heading !text-2xl sm:!text-3xl md:!text-4xl !text-ambe-cream mb-4 leading-tight">
              Get the Ambé Wellness Starter Guide
            </h2>

            <p className="text-ambe-cream/80 text-sm sm:text-base leading-relaxed mb-8">
              Everything you need to begin your holistic health journey—food, body
              care, herbs, and daily routines, all in one beautifully designed
              guide. Free, always.
            </p>

            {success ? (
              <p className="text-ambe-gold text-sm sm:text-base">
                Check your inbox — your starter guide is on its way.
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 rounded-sm bg-transparent border text-ambe-cream placeholder:text-ambe-cream/40 text-sm outline-none focus:border-ambe-gold"
                  style={{ borderColor: "rgba(244, 241, 234, 0.35)" }}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-sm text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase bg-ambe-peach text-charcoal hover:bg-ambe-gold transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? "Sending…" : "Download Free"}
                </button>
              </form>
            )}

            {error && (
              <p className="mt-3 text-sm text-ambe-peach">{error}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
