'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { BellIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ExpertHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState(null);

  // Fetch the current expert's profile from Firestore
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        const snap = await getDoc(doc(db, 'doctors', user.uid));
        if (snap.exists()) setDoctor(snap.data());
        setLoading(false);
      }
    });
    return unsub;
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  // Derive display name and pending tasks
  const fullName = auth.currentUser?.displayName || '';
  const lastName = fullName.split(' ').slice(-1)[0] || '';
  const isVerified = doctor?.verified ?? true;
  const pending = doctor?.pending ?? {};
  const reportCount = Number(pending.finish_report) || 0;

  // Build up any cards we need to show
  const cards = [];
  if (!isVerified) {
    cards.push({
      section: 'Status',
      title: 'Waiting to be approved',
      subtitle: 'Your account is currently under review.',
      href: '/expert/verification'
    });
  }
  if (reportCount > 0) {
    cards.push({
      section: 'Things to Do',
      title: 'Reports to finish',
      subtitle: `You have ${reportCount} report${reportCount > 1 ? 's' : ''} to finish.`,
      href: '/expert/reports-to-finish'
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Ambe</h1>
        <button
          onClick={() => router.push('/expert/notifications')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Greeting */}
      <p className="text-4xl font-normal text-yellow-500">
        Hello Dr. {lastName},
      </p>

      {/* Any pending cards */}
      {cards.map((card, idx) => (
        <div key={idx} className="space-y-2">
          <p className="text-sm uppercase font-semibold text-gray-600">
            {card.section}
          </p>
          <button
            onClick={() => router.push(card.href)}
            className="w-full bg-white border-l-4 border-green-600 shadow rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {card.title}
              </p>
              <p className="text-gray-600">{card.subtitle}</p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      ))}

      {cards.length === 0 && (
        <p className="text-gray-600">No tasks at the moment. Enjoy your day!</p>
      )}
    </div>
  );
}