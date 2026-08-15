'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

import BackButton from '@/components/common/BackButton';

export default function EditEmailPage() {
  const router = useRouter();
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) return router.push('/login');
      setCurrentEmail(user.email || '');
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!newEmail.trim()) {
      setError('New email is required');
      return;
    }
    if (requiresReauth && !password) {
      setError('Password is required to re-authenticate');
      return;
    }
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      if (requiresReauth) {
        const cred = EmailAuthProvider.credential(currentEmail, password);
        await reauthenticateWithCredential(user, cred);
      }
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      alert('Verification email sent. Please confirm.');
      router.push('/login');
    } catch (e) {
      const code = e.code;
      if (code === 'auth/requires-recent-login') {
        setRequiresReauth(true);
      } else {
        setError('Failed to update email');
        console.error(e);
      }
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Edit Email</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-[#6B6862] text-sm">
            You will be logged out after changing your email and must log back in.
          </p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Current Email</label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full p-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#8C827A] rounded-lg cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full p-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-[#C8996A]"
            />
          </div>
          {requiresReauth && (
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full p-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-[#C8996A]"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 rounded-lg text-sm font-semibold uppercase tracking-wider shadow-sm transition ${submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white'}`}
          >
            {submitting ? 'Updating…' : 'Update'}
          </button>
        </form>
      </div>
    </div>
  );
}
