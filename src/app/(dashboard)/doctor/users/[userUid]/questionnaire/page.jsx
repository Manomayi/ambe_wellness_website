// src/app/doctor/users/[userUid]/questionnaire/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';

export default function UserQuestionnairePage() {
  const router = useRouter();
  const { userUid } = useParams();
  const searchParams = useSearchParams();
  const userName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [doshaScores, setDoshaScores] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!userUid) return;

      try {
        const snap = await getDoc(
          doc(db, 'users', userUid, 'questionnaires', 'dosha_questionnaire')
        );
        if (snap.exists()) {
          const data = snap.data();
          setDoshaScores(data.dosha_scores || null);
          setResults(data.results || null);
        }
      } catch (e) {
        console.error('Error loading questionnaire:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [userUid, router]);

  const toTitleCase = str =>
    str
      .replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 rounded-full 
                        border-4 border-t-4 border-[#C8996A] 
                        border-t-transparent" />
      </div>
    );
  }

  if (!doshaScores || !results) {
    return (
      <p className="text-center text-[#6B6862]">
        No questionnaire found.
      </p>
    );
  }

  const primary = toTitleCase(doshaScores.primary || 'N/A');
  const secondary = toTitleCase(doshaScores.secondary || 'N/A');

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <BackButton
        href={`/doctor/users/${userUid}?name=${encodeURIComponent(userName)}`}
        label="Back to Patient"
      />
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">
          {userName.split(' ')[0]}'s Questionnaire
        </h1>
      </div>

      {/* Dosha Scores */}
      <div className="space-y-2">
        <p className="text-sm uppercase font-semibold text-[#6B6862] mb-2">
          Dosha Scores
        </p>
        <div className="bg-white border-l-4 border-[#C8996A] 
                        shadow rounded-lg p-4">
          <p className="font-bold text-[#1A1A1A]">
            {primary} / {secondary}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-2">
        <p className="text-sm uppercase font-semibold text-[#6B6862] mb-2">
          Results
        </p>
        <div className="bg-white border-l-4 border-[#C8996A] 
                        shadow rounded-lg p-4 space-y-4">
          {Object.entries(results).map(([question, answer]) => (
            <div key={question}>
              <p className="font-medium text-[#1A1A1A]">{question}</p>
              <p className="mt-1 text-[#6B6862]">{answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}