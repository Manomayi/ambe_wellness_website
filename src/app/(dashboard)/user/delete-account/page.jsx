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
import BackButton from '@/components/common/BackButton';
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
      setError('Please enter a valid email address');
      return;
    }

    if (currentUser?.email && trimmedEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      setError('Email does not match the current logged-in user');
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

      // 2. Delete user and doctor documents from Firestore
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
        setError('For security reasons, please log out, log back in, and try again.');
      } else {
        setError(err.message || 'Failed to delete account. Please try again later.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-2 border-[#C8996A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <BackButton />

      <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Delete Account</h1>
          <p className="text-sm font-medium text-red-600 mt-2">
            Once you delete your account, there is no going back.
          </p>
          <p className="text-xs text-[#6B6862] mt-1">
            Please enter your email and password to confirm that you want to delete your account.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleOpenConfirm} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C827A]">
                <EnvelopeIcon className="h-5 w-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-3 py-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-[#C8996A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C827A]">
                <LockClosedIcon className="h-5 w-5" />
              </div>
              <input
                type={obscurePassword ? 'password' : 'text'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-[#C8996A]"
              />
              <button
                type="button"
                onClick={() => setObscurePassword(!obscurePassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8C827A] hover:text-[#1A1A1A]"
              >
                {obscurePassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={deleting}
            className="w-full mt-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <TrashIcon className="h-4 w-4" />
            <span>DELETE ACCOUNT</span>
          </button>
        </form>
      </div>

      {/* Confirmation Dialog (Modal) matching app behavior */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-50 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A]">Are you sure?</h2>
            </div>
            <p className="text-sm text-[#6B6862] leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-semibold text-[#6B6862] hover:text-[#1A1A1A] rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
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
    </div>
  );
}
