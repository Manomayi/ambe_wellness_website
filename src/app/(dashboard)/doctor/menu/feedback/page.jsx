// src/app/doctor/feedback/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';

export default function DoctorFeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'doctors', user.uid, 'feedback', 'all'));
        const data = snap.data() || {};
        setFeedbacks(Array.isArray(data.feedback) ? data.feedback : []);
      } catch (err) {
        console.error('Error fetching feedback:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-4 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      <BackButton href="/doctor/menu" label="Back to Menu" />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Feedback</h1>
      </div>

      {feedbacks.length === 0 ? (
        <p className="text-[#6B6862]">No feedback yet.</p>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((f, i) => (
            <button
              key={i}
              className="
                w-full
                bg-white
                shadow
                rounded-lg
                border-l-4 border-[#C8996A]
                p-4
                flex items-center
                justify-between
                hover:bg-[#FAF8F5]
                transition
              "
            >
              <div className="flex items-center space-x-4">
                <img
                  src={f.user_photo}
                  alt={f.user_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-[#1A1A1A] text-left font-semibold">{f.user_name}</p>
                  <p className="text-[#6B6862] text-left">{f.feedback}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-[#1A1A1A]">
                {f.rating}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}