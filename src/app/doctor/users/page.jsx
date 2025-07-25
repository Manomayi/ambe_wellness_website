'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ExpertMemberProfilesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const snap = await getDoc(
          doc(db, 'doctors', user.uid, 'users', 'current')
        );
        const data = snap.exists() ? snap.data() : {};
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (e) {
        console.error('Error loading users', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold text-gray-800">User Profiles</h1>

      {users.length === 0 ? (
        <p className="text-gray-600">No profiles yet.</p>
      ) : (
        <div className="space-y-4">
          {users.map((m) => (
            <button
              key={m.uid}
              onClick={() =>
                router.push(`/doctor/users/${m.uid}?name=${encodeURIComponent(m.name)}`)
              }
              className="w-full bg-white shadow rounded-lg flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={m.profile_picture}
                  alt={m.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <span className="font-medium text-gray-800">{m.name}</span>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}