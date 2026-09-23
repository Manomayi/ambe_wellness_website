'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import {
  onAuthStateChanged,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/login');
      } else {
        setCurrentUser(u);
        if (u.email) {
          setEmail(u.email);
        }
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email cannot be empty');
      return;
    }

    const emailRegex = /^[^@]+@[^@]+\.[^@]+/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Enter a valid email address');
      return;
    }

    if (currentUser?.email && trimmedEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      setError('Email does not match the current user');
      return;
    }

    if (!password) {
      setError('Password is required to delete account');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setDeleting(true);
    setError('');

    try {
      // 1. Re-authenticate user with email and password
      const cred = EmailAuthProvider.credential(email.trim(), password);
      await reauthenticateWithCredential(currentUser, cred);

      // 2. Delete user, doctor, and verification documents from Firestore
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid));
      } catch (err) {
        console.warn('Could not clean users collection doc:', err);
      }

      try {
        await deleteDoc(doc(db, 'doctors', currentUser.uid));
      } catch (err) {
        console.warn('Could not clean doctors collection doc:', err);
      }

      try {
        await deleteDoc(doc(db, 'verification', currentUser.uid));
      } catch (err) {
        console.warn('Could not clean verification collection doc:', err);
      }

      // 3. Delete Firebase Auth user
      await deleteUser(currentUser);

      setShowConfirmDialog(false);
      alert('Account deleted successfully');
      router.push('/');
    } catch (err) {
      console.error('Delete account error:', err);
      setShowConfirmDialog(false);
      if (
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        setError('Incorrect password. Please verify your credentials and try again.');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please sign out and sign back in before deleting your account.');
      } else {
        setError(err.message || 'Failed to delete account. Please try again later.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <WebLayoutWrapper>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-3 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
        </div>
      </WebLayoutWrapper>
    );
  }

  return (
    <WebLayoutWrapper maxWidth="600px">
      {/* Sticky Top Bar with AmbeBackButton */}
      <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 mb-6 border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <AmbeBackButton />
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Delete Account
          </h1>
        </div>
      </div>

      <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6">
        <div className="space-y-2">
          <p className="text-white text-base font-semibold">
            Once you delete your account, there is no going back.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            Please enter your email and password to confirm that you want to delete your account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 flex items-start gap-2.5">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleOpenConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Email Address
            </label>
            <div className="relative flex items-center bg-white/5 border border-white/15 focus-within:border-[#FFD3AC] rounded-xl transition">
              <div className="pl-3.5 flex items-center pointer-events-none text-white/40">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-white/40 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-2">
              Password
            </label>
            <div className="relative flex items-center bg-white/5 border border-white/15 focus-within:border-[#FFD3AC] rounded-xl transition">
              <div className="pl-3.5 flex items-center pointer-events-none text-white/40">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                type={obscurePassword ? 'password' : 'text'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-transparent px-3 py-3 pr-10 text-sm text-white placeholder-white/40 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setObscurePassword(!obscurePassword)}
                className="absolute right-3 text-white/40 hover:text-white/80 transition cursor-pointer"
              >
                {obscurePassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => router.push('/forgot-password')}
              className="text-sm font-semibold text-[#FFD3AC] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={deleting}
              className="w-full py-4 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-full font-bold text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrashIcon className="h-5 w-5" />
              <span>DELETE ACCOUNT</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Dialog matching Flutter BackdropFilter AlertDialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#2D2D30] border border-red-600/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Are you sure?</h2>
              <p className="text-sm text-white/70 leading-relaxed">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-bold text-white/60 hover:text-white rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-sm font-bold text-red-500 hover:text-red-400 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                    <span>DELETING…</span>
                  </>
                ) : (
                  <span>DELETE</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </WebLayoutWrapper>
  );
}

