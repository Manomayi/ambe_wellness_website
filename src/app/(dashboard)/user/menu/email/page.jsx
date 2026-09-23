"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/config";
import {
  onAuthStateChanged,
  verifyBeforeUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import AmbeBackButton from "@/components/common/AmbeBackButton";
import AmbeButton from "@/components/common/AmbeButton";
import AmbeTextField from "@/components/common/AmbeTextField";

export default function EditEmailPage() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) return router.push("/login");
      setCurrentEmail(user.email || "");
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!newEmail.trim()) {
      setError("New email address is required.");
      return;
    }
    if (requiresReauth && !password) {
      setError("Password is required to confirm this change.");
      return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (requiresReauth) {
        const cred = EmailAuthProvider.credential(currentEmail, password);
        await reauthenticateWithCredential(user, cred);
      }
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (e) {
      const code = e.code;
      if (code === "auth/requires-recent-login") {
        setRequiresReauth(true);
        setError("Please enter your current password to proceed.");
      } else {
        setError(e.message || "Failed to update email.");
      }
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
    <div className="max-w-md mx-auto space-y-6">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <AmbeBackButton onClick={() => router.back()} />
          <h1 className="text-white text-xl font-bold font-sans flex-1">
            Edit Email
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        {/* Info notice */}
        <div className="bg-[#1B1A18]/70 border border-white/10 rounded-2xl p-4 text-xs font-sans text-gray-300 leading-relaxed">
          You will receive a confirmation link at your new email address. After confirming, please sign in with your new email.
        </div>

        {error && (
          <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-red-300 font-sans">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-950/70 border border-green-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-green-300 font-sans">
              Verification email sent! Redirecting to login…
            </p>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            Current Email
          </label>
          <AmbeTextField
            value={currentEmail}
            disabled
            className="opacity-75 cursor-not-allowed"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            New Email
          </label>
          <AmbeTextField
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
            required
          />
        </div>

        {requiresReauth && (
          <div className="space-y-1">
            <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
              Current Password
            </label>
            <AmbeTextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Confirm your password"
              showPasswordToggle
              required
            />
          </div>
        )}

        <div className="pt-6 flex justify-center">
          <AmbeButton type="submit" loading={submitting} className="w-full">
            UPDATE EMAIL
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
