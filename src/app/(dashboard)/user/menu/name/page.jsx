'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function EditNamePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // fetch user profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        // attempt to load from Firestore first
        const docRef = doc(db, 'doctors', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
        } else if (user.displayName) {
          const parts = user.displayName.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts[1] || '');
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Both fields are required');
      return;
    }
    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      // update auth
      await updateProfile(user, { displayName: fullName });
      // update Firestore
      const docRef = doc(db, 'doctors', user.uid);
      await updateDoc(docRef, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      router.back();
    } catch (e) {
      console.error(e);
      setError('Update failed');
    } finally {
      setUpdating(false);
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
    <div className="max-w-lg mx-auto bg-white border border-[#E7E2D9] rounded-xl p-8 shadow-sm space-y-6">
      <h1 className="text-2xl font-bold text-[#1A1A1A]">Edit Name</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-[#C8996A]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-lg focus:outline-none focus:border-[#C8996A]"
          />
        </div>
        <button
          type="submit"
          disabled={updating}
          className={`w-full py-3 rounded-lg text-sm font-semibold uppercase tracking-wider shadow-sm transition ${updating ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white'}`}
        >
          {updating ? 'Updating…' : 'Update'}
        </button>
      </form>
    </div>
  );
}
