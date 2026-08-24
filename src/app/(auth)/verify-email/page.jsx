"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase/config';
import { sendEmailVerification } from 'firebase/auth';
import { EnvelopeIcon, ArrowPathIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userType, signOut } = useAuth();

  const queryEmail = searchParams.get('email');
  const queryRole = searchParams.get('role');
  const displayEmail = user?.email || queryEmail || '';

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  // Default to 60s cooldown since an email was just dispatched at signup/login
  const [resendCooldown, setResendCooldown] = useState(60);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isVerified, setIsVerified] = useState(false);

  const navigateToDashboard = useCallback((role) => {
    const destinationRole = role || userType || queryRole;
    if (destinationRole === 'doctor') {
      router.push('/doctor/home');
    } else {
      router.push('/user/home');
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
          setMessage({ type: 'success', text: 'Email verified successfully! Redirecting...' });
          setTimeout(() => {
            navigateToDashboard();
          }, 1200);
          return true;
        }
      }
      if (!silent) {
        setMessage({
          type: 'info',
          text: 'Email not verified yet. Please check your inbox and click the verification link.',
        });
      }
      return false;
    } catch (err) {
      if (!silent) {
        setMessage({ type: 'error', text: 'Failed to check verification status. Please try again.' });
      }
      return false;
    } finally {
      if (!silent) setChecking(false);
    }
  }, [navigateToDashboard]);

  // Auto-polling for verification every 3.5 seconds
  useEffect(() => {
    if (isVerified) return;

    // Run initial silent check
    checkVerification(true);

    const interval = setInterval(() => {
      checkVerification(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [checkVerification, isVerified]);

  // Resend cooldown countdown
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
    setMessage({ type: '', text: '' });

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setIsVerified(true);
          setMessage({ type: 'success', text: 'Email already verified! Redirecting...' });
          setTimeout(() => {
            navigateToDashboard();
          }, 1200);
          return;
        }
        await sendEmailVerification(auth.currentUser);
        setMessage({
          type: 'success',
          text: 'Verification email sent! Check your inbox and spam folder.',
        });
        setResendCooldown(60);
      } else {
        setMessage({
          type: 'error',
          text: 'Session expired. Please sign in again to request a new verification link.',
        });
      }
    } catch (err) {
      if (err?.code === 'auth/too-many-requests' || String(err?.message).includes('too-many-requests')) {
        setMessage({
          type: 'info',
          text: 'A verification email was already sent recently. Please check your inbox and spam folder, or wait a minute before requesting another.',
        });
        setResendCooldown(60);
      } else {
        setMessage({
          type: 'error',
          text: err.message || 'Failed to send verification email. Please try again.',
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.warn('Sign out warning:', err);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl sm:text-4xl font-normal tracking-wide transition-opacity hover:opacity-80 select-none"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
          >
            AMBÉ
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] mt-1.5 font-medium" style={{ color: "#C2691C" }}>
            Integrative Ayurveda
          </p>
        </div>

        {/* Verification Card */}
        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl border border-[#E7E2D9] text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF0E6] mb-5 border border-[#FFD3AC]">
            {isVerified ? (
              <CheckCircleIcon className="w-8 h-8 text-[#2E7D32]" />
            ) : (
              <EnvelopeIcon className="w-8 h-8 text-[#C2691C]" />
            )}
          </div>

          {/* Heading */}
          <h2
            className="text-2xl sm:text-3xl font-medium mb-2 select-none"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
          >
            {isVerified ? 'Email Verified' : 'Verify Your Email'}
          </h2>

          <p className="text-sm leading-relaxed mb-4" style={{ color: "#6B6862" }}>
            We sent a verification link to:
          </p>

          {/* Display Email */}
          <div className="inline-block px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9] mb-6 max-w-full overflow-hidden text-ellipsis">
            <span className="text-xs sm:text-sm font-semibold tracking-wide" style={{ color: "#1A1A1A" }}>
              {displayEmail || 'your email address'}
            </span>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: "#6B6862" }}>
            Please check your inbox (and spam or junk folder) and click the verification link to activate your account.
          </p>

          {/* Alert Message */}
          {message.text && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-xs sm:text-sm border leading-relaxed ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : message.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => checkVerification(false)}
              disabled={checking || isVerified}
              className="w-full flex items-center justify-center px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {checking ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Checking Status...
                </>
              ) : (
                "I've Verified My Email"
              )}
            </button>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || resending || isVerified}
              className="w-full py-3 rounded-full text-xs font-medium uppercase tracking-[0.12em] transition-all border border-[#E7E2D9] text-[#1A1A1A] hover:bg-[#FAF8F5] disabled:opacity-50 cursor-pointer"
            >
              {resending
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend Email (${resendCooldown}s)`
                : "Resend Verification Email"}
            </button>
          </div>

          {/* Auto check hint */}
          <div className="mt-6 pt-4 border-t border-[#F4F1EA] flex items-center justify-center gap-1.5 text-xs" style={{ color: "#9A948B" }}>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Automatically detecting your verification…</span>
          </div>
        </div>

        {/* Change account link */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center text-xs uppercase tracking-widest font-semibold text-[#6B6862] hover:text-[#1A1A1A] transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 mr-1" />
            Sign in with a different account
          </button>
        </div>
      </div>
    </div>
  );
}
