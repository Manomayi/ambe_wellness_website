// src/app/expert/feedback/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ExpertFeedbackPage() {
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
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
       
        <h1 className="text-2xl font-semibold text-gray-800">Feedback</h1>
      </div>

      {feedbacks.length === 0 ? (
        <p className="text-gray-600">No feedback yet.</p>
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
                border-l-4 border-green-600
                p-4
                flex items-center
                justify-between
                hover:bg-gray-50
                transition
              "
            >
              <div className="flex items-center space-x-4">
                <img
                  src={f.member_photo}
                  alt={f.member_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="text-gray-800 font-medium">{f.member_name}</p>
                  <p className="text-gray-600">{f.feedback}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-800">
                {f.rating}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}