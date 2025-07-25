'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

export default function EditPasswordPage() {
  const router = useRouter();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) router.push('/login');
      else setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const validate = () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      setError('All fields are required');
      return false;
    }
    const pwdRegex = /^(?=.*[A-Za-z])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!pwdRegex.test(newPwd)) {
      setError('Password must be at least 8 characters, include a letter, and a special character.');
      return false;
    }
    if (newPwd !== confirmPwd) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      // Reauthenticate
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      // Update
      await updatePassword(user, newPwd);
      alert('Password updated successfully');
      router.back();
    } catch (e) {
      console.error(e);
      setError(e.code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Failed to update password');
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
      <h1 className="text-2xl font-semibold text-gray-800">Change Password</h1>
      <p className="text-sm text-gray-600">
        Password must be at least 8 characters, include a letter, and a special character.
      </p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)}
              className="w-full p-2 border text-black border-gray-300 bg-white rounded-lg focus:outline-none focus:border-green-600"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showCurrent ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              className="w-full p-2 border text-black border-gray-300 bg-white rounded-lg focus:outline-none focus:border-green-600"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              className="w-full p-2 border text-black border-gray-300 bg-white rounded-lg focus:outline-none focus:border-green-600"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
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
