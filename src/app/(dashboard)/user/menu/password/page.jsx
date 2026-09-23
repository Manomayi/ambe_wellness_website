"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import AmbeBackButton from "@/components/common/AmbeBackButton";
import AmbeButton from "@/components/common/AmbeButton";
import AmbeTextField from "@/components/common/AmbeTextField";

const LockIcon = () => (
  <svg
    className="w-5 h-5 text-[#FFD3AC]"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    viewBox="0 0 24 24"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={1.8} />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      d="M8 11V7a4 4 0 018 0v4"
    />
  </svg>
);

export default function EditPasswordPage() {
  const router = useRouter();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
      else setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const validate = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      setError("All fields are required.");
      return false;
    }
    if (newPwd.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (!/[A-Z]/.test(newPwd)) {
      setError("Password must include at least one uppercase letter.");
      return false;
    }
    if (!/[0-9]/.test(newPwd)) {
      setError("Password must include at least one number.");
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPwd)) {
      setError("Password must include at least one special character.");
      return false;
    }
    if (newPwd !== confirmPwd) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (e) {
      console.error(e);
      setError(
        e.code === "auth/wrong-password"
          ? "Current password is incorrect."
          : "Failed to update password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-1 pb-10">
      {/* Sticky Top Bar matching App (Image 2) */}
      <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="absolute left-0">
            <AmbeBackButton onClick={() => router.back()} />
          </div>
          <h1 className="text-white text-xl sm:text-2xl font-heading font-normal tracking-wide text-center">
            Change Password
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Title & Subtitle matching App (Image 2) */}
        <div className="pb-3">
          <h2 className="text-white text-2xl sm:text-[26px] font-semibold font-sans tracking-tight mb-1.5">
            Change Your Password
          </h2>
          <p className="text-gray-400 font-sans text-sm sm:text-[15px] leading-relaxed">
            Enter your current password and choose a new one
          </p>
        </div>

        {error && (
          <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs sm:text-sm text-red-300 font-sans">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-950/70 border border-green-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs sm:text-sm text-green-300 font-sans">
              Password updated successfully!
            </p>
          </div>
        )}

        {/* Current Password Field */}
        <AmbeTextField
          type="password"
          value={currentPwd}
          onChange={(e) => {
            setCurrentPwd(e.target.value);
            if (error) setError("");
          }}
          placeholder="Current Password"
          leadingIcon={<LockIcon />}
          showPasswordToggle
          required
        />

        {/* New Password Field */}
        <AmbeTextField
          type="password"
          value={newPwd}
          onChange={(e) => {
            setNewPwd(e.target.value);
            if (error) setError("");
          }}
          placeholder="New Password"
          leadingIcon={<LockIcon />}
          showPasswordToggle
          required
        />

        {/* Password Requirements Guidance */}
        <div className="bg-white/95 border border-[#FFD3AC]/80 rounded-2xl p-4 shadow-md backdrop-blur-xs space-y-2.5">
          <p className="text-neutral-800 font-semibold text-xs tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F5B880]" />
            Password Requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className={`flex items-center gap-2 transition-colors ${newPwd.length >= 8 ? 'text-emerald-700 font-semibold' : 'text-neutral-600'}`}>
              {newPwd.length >= 8 ? (
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 bg-neutral-100 shrink-0 inline-block" />
              )}
              <span>At least 8 characters</span>
            </div>

            <div className={`flex items-center gap-2 transition-colors ${/[A-Z]/.test(newPwd) ? 'text-emerald-700 font-semibold' : 'text-neutral-600'}`}>
              {/[A-Z]/.test(newPwd) ? (
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 bg-neutral-100 shrink-0 inline-block" />
              )}
              <span>At least one uppercase (A-Z)</span>
            </div>

            <div className={`flex items-center gap-2 transition-colors ${/[0-9]/.test(newPwd) ? 'text-emerald-700 font-semibold' : 'text-neutral-600'}`}>
              {/[0-9]/.test(newPwd) ? (
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 bg-neutral-100 shrink-0 inline-block" />
              )}
              <span>At least one number (0-9)</span>
            </div>

            <div className={`flex items-center gap-2 transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(newPwd) ? 'text-emerald-700 font-semibold' : 'text-neutral-600'}`}>
              {/[!@#$%^&*(),.?":{}|<>]/.test(newPwd) ? (
                <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 bg-neutral-100 shrink-0 inline-block" />
              )}
              <span>Special character (@, #, $, etc.)</span>
            </div>
          </div>
        </div>

        {/* Confirm New Password Field */}
        <AmbeTextField
          type="password"
          value={confirmPwd}
          onChange={(e) => {
            setConfirmPwd(e.target.value);
            if (error) setError("");
          }}
          placeholder="Confirm New Password"
          leadingIcon={<LockIcon />}
          showPasswordToggle
          required
        />

        {/* Update Button */}
        <div className="pt-8 flex justify-center">
          <AmbeButton
            type="submit"
            loading={submitting}
            className="w-full py-4 uppercase font-bold tracking-wider"
          >
            UPDATE PASSWORD
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
