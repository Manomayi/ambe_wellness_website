"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { sendEmailVerification } from "firebase/auth";
import AmbeButton from "@/components/common/AmbeButton";
import AmbeTextField from "@/components/common/AmbeTextField";
import AmbeBackButton, { AmbeCloseButton } from "@/components/common/AmbeBackButton";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const userType = await signIn(email.trim(), password);

      if (auth.currentUser && !auth.currentUser.emailVerified) {
        try {
          const roleParam = userType || "user";
          const continueUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/continue?source=web&role=${roleParam}`
              : `https://ambewellness.com/auth/continue?source=web&role=${roleParam}`;
          await sendEmailVerification(auth.currentUser, {
            url: continueUrl,
            handleCodeInApp: false,
          });
        } catch (verifyErr) {
          console.warn("Verification email send error:", verifyErr);
        }
        router.push(`/verify-email?email=${encodeURIComponent(email.trim())}&role=${userType}`);
        return;
      }

      if (userType === "doctor") {
        router.push("/doctor/home");
      } else {
        router.push("/user/home");
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email address or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[520px] sm:min-h-[560px] px-2 sm:px-4">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pt-2 pb-6">
        <AmbeBackButton onClick={() => router.push("/")} />
        <h1 className="text-white text-xl font-semibold tracking-wide font-sans">
          Sign In
        </h1>
        <AmbeCloseButton onClick={() => router.push("/")} />
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 w-full">
          {/* Email Field */}
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
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            }
          />

          {/* Password Field */}
          <AmbeTextField
            type="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError("");
            }}
            placeholder="Password"
            required
            autoComplete="current-password"
            showPasswordToggle
            leadingIcon={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            }
          />

          {/* Forgot Password */}
          <div className="text-right pt-1">
            <Link
              href="/forgot-password"
              className="text-sm font-sans text-[#FFD3AC] hover:underline transition-opacity"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
              <p className="text-xs text-red-300 font-sans">{error}</p>
            </div>
          )}

          {/* Sign In Button */}
          <div className="pt-6 flex justify-center">
            <AmbeButton
              type="submit"
              loading={loading}
              className="w-full sm:w-[260px]"
            >
              SIGN IN
            </AmbeButton>
          </div>
        </form>
      </div>

      {/* Register Link */}
      <div className="text-center pt-6 pb-2">
        <p className="text-sm font-sans text-gray-200">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-[#FFD3AC] font-semibold hover:underline underline-offset-4 ml-1 inline-block"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
