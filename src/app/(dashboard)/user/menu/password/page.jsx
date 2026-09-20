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
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(newPwd)) {
      setError(
        "Password must be at least 8 characters, include a letter, and a special character."
      );
      return false;
    }
    if (newPwd !== confirmPwd) {
      setError("New passwords do not match.");
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
    <div className="max-w-md mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-bold font-sans flex-1">
          Change Password
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <p className="text-xs font-sans text-gray-400 px-2 leading-relaxed">
          Password must be at least 8 characters, include a letter, and a special character.
        </p>

        {error && (
          <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-red-300 font-sans">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-950/70 border border-green-500/50 rounded-2xl p-3 text-center">
            <p className="text-xs text-green-300 font-sans">
              Password updated successfully!
            </p>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            Current Password
          </label>
          <AmbeTextField
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Enter current password"
            showPasswordToggle
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            New Password
          </label>
          <AmbeTextField
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Enter new password"
            showPasswordToggle
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 px-4">
            Confirm New Password
          </label>
          <AmbeTextField
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Confirm new password"
            showPasswordToggle
            required
          />
        </div>

        <div className="pt-6 flex justify-center">
          <AmbeButton type="submit" loading={submitting} className="w-full">
            UPDATE PASSWORD
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
