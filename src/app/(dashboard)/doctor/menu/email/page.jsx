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

export default function DoctorEditEmailPage() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      setError("New email is required");
      return;
    }
    if (requiresReauth && !password) {
      setError("Password is required to re-authenticate");
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
      alert("Verification email sent. Please confirm before logging in with your new email.");
      router.push("/login");
    } catch (e) {
      const code = e.code;
      if (code === "auth/requires-recent-login") {
        setRequiresReauth(true);
      } else {
        setError("Failed to update email. Please try again.");
        console.error(e);
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
      {/* Top Bar */}
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-bold font-sans flex-1">
          Edit Email
        </h1>
      </div>

      {/* Notice Card */}
      <div className="bg-[#2D2D30]/80 border border-white/10 rounded-2xl p-4 text-xs text-gray-300 font-sans leading-relaxed">
        <p>
          <strong className="text-[#FFD3AC]">Notice:</strong> You will be logged out after changing your email and must verify your new email address before logging back in.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-red-300 font-sans">{error}</p>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            Current Email
          </label>
          <AmbeTextField
            type="email"
            value={currentEmail}
            disabled
            className="opacity-60 cursor-not-allowed"
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
              Confirm Password
            </label>
            <AmbeTextField
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
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
