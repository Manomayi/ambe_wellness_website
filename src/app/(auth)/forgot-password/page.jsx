"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import AmbeButton from "@/components/common/AmbeButton";
import AmbeTextField from "@/components/common/AmbeTextField";
import AmbeBackButton, { AmbeCloseButton } from "@/components/common/AmbeBackButton";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to send reset link. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[520px] sm:min-h-[580px] px-2 sm:px-4">
      {/* Top Navigation Bar matching Flutter ForgotPasswordPage */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <AmbeBackButton onClick={() => router.push("/login")} />
        <h1 className="text-white text-xl font-semibold tracking-wide font-sans">
          Forgot Password
        </h1>
        <AmbeCloseButton onClick={() => router.push("/login")} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center my-4">
        {/* App Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logos/ambe_logo.png"
            alt="Ambé Wellness"
            width={160}
            height={70}
            className="h-[65px] sm:h-[70px] w-auto object-contain drop-shadow"
            priority
          />
        </div>

        {!emailSent ? (
          <>
            {/* Instruction text */}
            <p className="text-white text-center text-base font-normal max-w-sm mx-auto mb-8 font-sans leading-relaxed">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            {/* Forgot Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4 w-full">
              <AmbeTextField
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="email address"
                required
                autoComplete="email"
                leadingIcon={
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                }
              />

              {error && (
                <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
                  <p className="text-xs text-red-300 font-sans">{error}</p>
                </div>
              )}

              <div className="pt-6 flex justify-center">
                <AmbeButton
                  type="submit"
                  loading={loading}
                  className="w-full sm:w-[260px]"
                >
                  SEND RESET LINK
                </AmbeButton>
              </div>
            </form>
          </>
        ) : (
          /* Success state matching Flutter */
          <div className="space-y-6 max-w-sm mx-auto w-full">
            <div className="p-4 rounded-xl bg-green-900/30 border border-green-500/40 text-green-300 flex items-center gap-3">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium font-sans">
                Password reset link sent! Check your email.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <AmbeButton
                onClick={() => router.push("/login")}
                className="w-full sm:w-[260px]"
              >
                BACK TO LOGIN
              </AmbeButton>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Link (only shown if email not sent) */}
      {!emailSent ? (
        <div className="text-center pt-8 pb-4">
          <p className="text-sm font-sans text-gray-300">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-[#FFD3AC] font-semibold hover:underline ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      ) : (
        <div className="h-10" />
      )}
    </div>
  );
}
