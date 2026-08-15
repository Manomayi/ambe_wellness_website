'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
import {
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

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

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmation !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user');

      // Attempt cleaning user profile in firestore
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid));
      } catch (fErr) {
        console.warn('Could not clean firestore record:', fErr);
      }

      await deleteUser(currentUser);
      alert('Your account has been deleted.');
      router.push('/');
    } catch (err) {
      console.error('Delete account error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in before deleting your account.');
      } else {
        setError('Failed to delete account. Please try again or contact support.');
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

      <div className="bg-white border border-red-200 rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 text-red-600">
          <div className="p-3 bg-red-50 rounded-full">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-600">Delete Account</h1>
            <p className="text-xs text-[#8C827A]">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-red-50/60 border border-red-100 rounded-lg p-4 text-xs text-red-800 space-y-2 leading-relaxed">
          <p className="font-semibold">Deleting your account will permanently remove:</p>
          <ul className="list-disc list-inside space-y-1 text-red-700">
            <li>Your user profile and personal health details</li>
            <li>Consultation history and active doctor pairing</li>
            <li>Dosha assessment records and purchase references</li>
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
              Type <strong className="text-red-600">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full p-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={deleting || confirmation !== 'DELETE'}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            <TrashIcon className="h-4 w-4" />
            <span>{deleting ? 'Deleting Account…' : 'Permanently Delete Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
