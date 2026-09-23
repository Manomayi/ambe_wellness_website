"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { sendEmailVerification } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import AmbeButton from "@/components/common/AmbeButton";
import AmbeBackButton from "@/components/common/AmbeBackButton";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userType, signOut } = useAuth();

  const queryEmail = searchParams.get("email");
  const queryRole = searchParams.get("role");
  const displayEmail = user?.email || queryEmail || "";

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isVerified, setIsVerified] = useState(false);

  const navigateToDashboard = useCallback(async (role) => {
    let destinationRole = role || userType || queryRole;
    if (!destinationRole && auth.currentUser) {
      try {
        const doctorSnap = await getDoc(doc(db, "doctors", auth.currentUser.uid));
        destinationRole = doctorSnap.exists() ? "doctor" : "user";
      } catch (err) {
        console.warn("Could not check doctor doc:", err);
      }
    }
    if (destinationRole === "doctor") {
      router.push("/doctor/home");
    } else {
      let isCompleted = false;
      if (auth.currentUser) {
        try {
          const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
          isCompleted = userSnap.data()?.is_free_questionnaire_completed === true;
        } catch (err) {
          console.warn("Could not check user doc:", err);
        }
      }
      if (!isCompleted) {
        router.push("/user/menu/questionnaire");
      } else {
        router.push("/user/home");
      }
    }
  }, [router, userType, queryRole]);

  // Check verification state
  const checkVerification = useCallback(async (silent = false) => {
    if (!silent) setChecking(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setIsVerified(true);
          setMessage({ type: "success", text: "Email verified successfully! Redirecting..." });
          setTimeout(() => {
            navigateToDashboard();
          }, 1200);
          return true;
        }
      }
      if (!silent) {
        setMessage({
          type: "info",
          text: "Email not verified yet. Please check your inbox and click the verification link.",
        });
      }
      return false;
    } catch (err) {
      if (!silent) {
        setMessage({ type: "error", text: "Failed to check verification status. Please try again." });
      }
      return false;
    } finally {
      if (!silent) setChecking(false);
    }
  }, [navigateToDashboard]);

  // Auto-polling every 3.5 seconds
  useEffect(() => {
    if (isVerified) return;
    checkVerification(true);
    const interval = setInterval(() => {
      checkVerification(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [checkVerification, isVerified]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setMessage({ type: "", text: "" });

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setIsVerified(true);
          setMessage({ type: "success", text: "Email already verified! Redirecting..." });
          setTimeout(() => {
            navigateToDashboard();
          }, 1200);
          return;
        }
        const roleParam = userType || queryRole || "user";
        const continueUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/continue?source=web&role=${roleParam}`
            : `https://ambewellness.com/auth/continue?source=web&role=${roleParam}`;
        await sendEmailVerification(auth.currentUser, {
          url: continueUrl,
          handleCodeInApp: false,
        });
        setMessage({
          type: "success",
          text: "Verification email sent! Check your inbox and spam folder.",
        });
        setResendCooldown(60);
      } else {
        setMessage({
          type: "error",
          text: "Session expired. Please sign in again to request a new verification link.",
        });
      }
    } catch (err) {
      if (err?.code === "auth/too-many-requests" || String(err?.message).includes("too-many-requests")) {
        setMessage({
          type: "info",
          text: "A verification email was already sent recently. Please check your spam folder, or wait a minute.",
        });
        setResendCooldown(60);
      } else {
        setMessage({
          type: "error",
          text: err.message || "Failed to send verification email.",
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (err) {
      router.push("/login");
    }
  };

  return (
    <div className="w-full flex flex-col justify-between min-h-[580px] sm:min-h-[620px] px-2 sm:px-4 text-center">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <AmbeBackButton onClick={() => router.push("/login")} />
        <h1 className="text-white text-xl font-semibold tracking-wide font-sans">
          Verification
        </h1>
        <div className="w-10" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center my-6">
        {/* Large Circle with Peach Email Icon */}
        <div className="w-24 h-24 rounded-full bg-[#FFD3AC]/15 flex items-center justify-center mb-6">
          <svg
            className="w-12 h-12 text-[#FFD3AC]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight mb-3 font-sans">
          {isVerified ? "Email Verified!" : "Verify Your Email"}
        </h2>

        {/* Instructions */}
        <p className="text-gray-400 text-sm font-sans mb-1">
          We&apos;ve sent a verification link to:
        </p>

        <p className="text-[#FFD3AC] text-base font-semibold font-sans mb-4 max-w-full truncate px-4">
          {displayEmail || "your email address"}
        </p>

        <p className="text-gray-400 text-xs sm:text-sm font-sans max-w-xs leading-relaxed mb-6">
          Please open the email and click the verification link. This page will automatically detect when your email is verified.
        </p>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`w-full max-w-sm mb-6 p-3 rounded-2xl text-xs font-sans border ${
              message.type === "success"
                ? "bg-green-950/70 border-green-500/50 text-green-300"
                : message.type === "error"
                ? "bg-red-950/70 border-red-500/50 text-red-300"
                : "bg-amber-950/70 border-amber-500/50 text-amber-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full max-w-xs space-y-3">
          <AmbeButton
            onClick={() => checkVerification(false)}
            loading={checking}
            className="w-full"
          >
            I&apos;VE VERIFIED MY EMAIL
          </AmbeButton>

          <AmbeButton
            onClick={handleResendEmail}
            isOutlined
            disabled={resendCooldown > 0 || resending || isVerified}
            className="w-full text-xs uppercase"
          >
            {resending
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend Email (${resendCooldown}s)`
              : "Resend Email"}
          </AmbeButton>
        </div>
      </div>

      {/* Change account link */}
      <div className="pt-4 pb-2 text-center">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs font-sans text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign out &amp; start over
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
