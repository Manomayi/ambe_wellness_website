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
import AmbeTextField from '@/components/common/AmbeTextField';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function DoctorEditPasswordPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    currentPwd: '',
    newPwd: '',
    confirmPwd: '',
    general: '',
  });
  const [success, setSuccess] = useState('');

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
    const errors = {
      currentPwd: '',
      newPwd: '',
      confirmPwd: '',
      general: '',
    };
    let isValid = true;

    if (!currentPwd.trim()) {
      errors.currentPwd = 'Please enter your current password';
      isValid = false;
    }

    if (!newPwd.trim()) {
      errors.newPwd = 'Please enter a new password';
      isValid = false;
    } else if (newPwd.trim().length < 8) {
      errors.newPwd = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/[A-Z]/.test(newPwd)) {
      errors.newPwd = 'Password must include at least one uppercase letter';
      isValid = false;
    } else if (!/[0-9]/.test(newPwd)) {
      errors.newPwd = 'Password must include at least one number';
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPwd)) {
      errors.newPwd = 'Password must include at least one special character';
      isValid = false;
    }

    if (!confirmPwd.trim()) {
      errors.confirmPwd = 'Please confirm your new password';
      isValid = false;
    } else if (newPwd.trim() !== confirmPwd.trim()) {
      errors.confirmPwd = 'Confirmation password does not match';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({ currentPwd: '', newPwd: '', confirmPwd: '', general: '' });
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
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code?.includes('invalid-credential')
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          currentPwd: 'Current password is incorrect',
        }));
      } else if (err.code === 'auth/weak-password') {
        setFieldErrors((prev) => ({
          ...prev,
          newPwd: 'New password is too weak',
        }));
      } else if (err.code === 'auth/requires-recent-login') {
        setFieldErrors((prev) => ({
          ...prev,
          general: 'Please log out and log back in before changing password',
        }));
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          general: err.message || 'Failed to update password. Please try again.',
        }));
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
    <div className="w-full pb-24 md:pb-12 text-white">
      {/* Sticky Top Bar with Centered Serif Title matching Flutter AppBar */}
      <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-3 sm:-mx-6 md:-mx-8 px-3 sm:px-6 md:px-8 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
        <div className="relative max-w-xl mx-auto flex items-center justify-center">
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
      </div>

      {/* Main Content Form */}
      <div className="max-w-md mx-auto w-full pt-6 px-4 sm:px-0">
        {/* Title and Subtitle matching Image 2 */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Change Your Password
          </h2>
          <p className="text-sm text-neutral-400 mt-1 leading-relaxed">
            Enter your current password and choose a new one
          </p>
        </div>

        {/* General Feedback Alert */}
        {fieldErrors.general && (
          <div className="mb-4 p-3.5 bg-red-900/30 border border-red-500/40 rounded-2xl text-xs text-red-200 text-center font-sans">
            {fieldErrors.general}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3.5 bg-emerald-900/30 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 text-center font-sans">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Hidden username input for password manager auto-save linking */}
          <input
            type="text"
            name="username"
            value={user?.email || ''}
            autoComplete="username"
            readOnly
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {/* Current Password Field */}
          <AmbeTextField
            type="password"
            name="current-password"
            value={currentPwd}
            onChange={(e) => {
              setCurrentPwd(e.target.value);
              if (fieldErrors.currentPwd || fieldErrors.general) {
                setFieldErrors((prev) => ({ ...prev, currentPwd: '', general: '' }));
              }
            }}
            placeholder="Current Password"
            autoComplete="current-password"
            leadingIcon={<LockClosedIcon className="w-5 h-5 text-[#FFD3AC]" />}
            showPasswordToggle
            error={fieldErrors.currentPwd}
            required
          />

          {/* New Password Field */}
          <AmbeTextField
            type="password"
            name="new-password"
            value={newPwd}
            onChange={(e) => {
              setNewPwd(e.target.value);
              if (fieldErrors.newPwd || fieldErrors.general) {
                setFieldErrors((prev) => ({ ...prev, newPwd: '', general: '' }));
              }
            }}
            placeholder="New Password"
            autoComplete="new-password"
            leadingIcon={<LockClosedIcon className="w-5 h-5 text-[#FFD3AC]" />}
            showPasswordToggle
            error={fieldErrors.newPwd}
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

          {/* Confirm Password Field */}
          <AmbeTextField
            type="password"
            name="confirm-new-password"
            value={confirmPwd}
            onChange={(e) => {
              setConfirmPwd(e.target.value);
              if (fieldErrors.confirmPwd || fieldErrors.general) {
                setFieldErrors((prev) => ({ ...prev, confirmPwd: '', general: '' }));
              }
            }}
            placeholder="Confirm New Password"
            autoComplete="new-password"
            leadingIcon={<LockClosedIcon className="w-5 h-5 text-[#FFD3AC]" />}
            showPasswordToggle
            error={fieldErrors.confirmPwd}
            required
          />

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
