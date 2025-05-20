'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

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
        <div className="animate-spin h-10 w-10 border-4 border-t-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Edit Email</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-600 text-sm">
          You will be logged out after changing your email and must log back in.
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
          <input
            type="email"
            value={currentEmail}
            disabled
            className="w-full p-2 border border-gray-300 text-black bg-gray-100 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 text-black rounded-lg focus:outline-none focus:border-green-600"
          />
        </div>
        {requiresReauth && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 text-black rounded-lg focus:outline-none focus:border-green-600"
            />
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg text-white font-semibold shadow transition ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {submitting ? 'Updating…' : 'Update'}
        </button>
      </form>
    </div>
  );
}
