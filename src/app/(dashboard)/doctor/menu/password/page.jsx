// src/app/(dashboard)/doctor/menu/password/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import {
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function DoctorEditPasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/login');
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const validate = () => {
    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) {
      setError('Field cannot be empty');
      return false;
    }
    if (newPwd.trim().length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(newPwd)) {
      setError('Password must include at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(newPwd)) {
      setError('Password must include at least one number');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPwd)) {
      setError('Password must include at least one special character');
      return false;
    }
    if (newPwd.trim() !== confirmPwd.trim()) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;
    setSubmitting(true);

    try {
      if (!user?.email) throw new Error('No user email found');

      // Re-authenticate with current password
      const cred = EmailAuthProvider.credential(user.email, currentPwd.trim());
      await reauthenticateWithCredential(user, cred);

      // Update password
      await updatePassword(user, newPwd.trim());

      setSuccess('Password updated successfully!');
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back();
        } else {
          router.push('/doctor/menu');
        }
      }, 1000);
    } catch (err) {
      console.error('Password update error:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setError('New password is too weak');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before changing password');
      } else {
        setError(err.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin h-9 w-9 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12 pt-2 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      {/* Top Bar with Centered Serif Title matching Flutter AppBar */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute left-0">
          <AmbeBackButton
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/doctor/menu');
              }
            }}
          />
        </div>
        <h1 className="font-serif text-2xl font-normal tracking-wide text-white">
          Change Password
        </h1>
      </div>

      {/* Main Content Form */}
      <div className="max-w-md mx-auto w-full pt-2">
        {/* Title and Subtitle matching Image 2 */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Change Your Password
          </h2>
          <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
            Enter your current password and choose a new one
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-900/30 border border-red-500/40 rounded-2xl text-xs text-red-200 text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-900/30 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password Field */}
          <div className="relative flex items-center">
            <div className="absolute left-4.5 pointer-events-none text-[#FFD3AC] flex items-center justify-center">
              <LockClosedIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="Current Password"
              className="w-full bg-white text-[#1E1E1E] placeholder:text-neutral-400 text-base font-sans rounded-full py-4 pl-12 pr-12 outline-none border border-transparent focus:border-[#FFD3AC] shadow-md transition"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-4 text-[#FFD3AC] hover:text-[#f8caa1] p-1.5 focus:outline-none cursor-pointer transition"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? (
                // Eye Open
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                // Eye Slash
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>

          {/* New Password Field */}
          <div className="relative flex items-center">
            <div className="absolute left-4.5 pointer-events-none text-[#FFD3AC] flex items-center justify-center">
              <LockClosedIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="New Password"
              className="w-full bg-white text-[#1E1E1E] placeholder:text-neutral-400 text-base font-sans rounded-full py-4 pl-12 pr-12 outline-none border border-transparent focus:border-[#FFD3AC] shadow-md transition"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowNew(!showNew)}
              className="absolute right-4 text-[#FFD3AC] hover:text-[#f8caa1] p-1.5 focus:outline-none cursor-pointer transition"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? (
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>

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

          {/* Confirm Password Field */}
          <div className="relative flex items-center">
            <div className="absolute left-4.5 pointer-events-none text-[#FFD3AC] flex items-center justify-center">
              <LockClosedIcon className="w-5 h-5 stroke-[2]" />
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full bg-white text-[#1E1E1E] placeholder:text-neutral-400 text-base font-sans rounded-full py-4 pl-12 pr-12 outline-none border border-transparent focus:border-[#FFD3AC] shadow-md transition"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 text-[#FFD3AC] hover:text-[#f8caa1] p-1.5 focus:outline-none cursor-pointer transition"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? (
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              )}
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#FFD3AC] hover:bg-[#ffe2c8] text-black py-4 rounded-full text-base font-bold uppercase tracking-wider shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'UPDATING PASSWORD…' : 'UPDATE PASSWORD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
