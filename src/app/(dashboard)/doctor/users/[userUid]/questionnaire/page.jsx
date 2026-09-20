// src/app/doctor/users/[userUid]/questionnaire/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { SparklesIcon } from '@heroicons/react/24/outline';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';

export default function UserQuestionnairePage() {
  const router = useRouter();
  const { userUid } = useParams();
  const searchParams = useSearchParams();
  const userName = searchParams.get('name') || '';

  const [loading, setLoading] = useState(true);
  const [doshaScores, setDoshaScores] = useState(null);
  const [basicResults, setBasicResults] = useState(null);
  const [extendedResults, setExtendedResults] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!userUid) return;

      try {
        const [doshaSnap, extendedSnap] = await Promise.all([
          getDoc(doc(db, 'users', userUid, 'questionnaires', 'dosha_questionnaire')),
          getDoc(doc(db, 'users', userUid, 'questionnaires', 'extended')),
        ]);

        if (doshaSnap.exists()) {
          const data = doshaSnap.data();
          setDoshaScores(data.dosha_scores || null);
          setBasicResults(data.results || null);
        }

        if (extendedSnap.exists()) {
          const data = extendedSnap.data();
          setExtendedResults(data.results || null);
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
    (str || '')
      .replace(/_/g, ' ')
      .replace(/\w\S*/g, txt =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  const displayName = userName.trim() ? userName.split(' ')[0] : 'Patient';
  const primary = toTitleCase(doshaScores?.primary || 'N/A');
  const secondary = toTitleCase(doshaScores?.secondary || 'N/A');

  const renderSectionHeader = (title) => (
    <div className="flex items-center gap-2.5 mb-3 pt-2">
      <div className="w-1 h-4 rounded-full bg-[#FFD3AC]" />
      <h2 className="text-xs font-bold text-[#FFD3AC] tracking-wider uppercase">
        {title}
      </h2>
    </div>
  );

  const renderResultsList = (resultsMap) => {
    if (!resultsMap || Object.keys(resultsMap).length === 0) {
      return (
        <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-md">
          <p className="text-sm text-neutral-400">No responses recorded.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(resultsMap).map(([question, answer]) => (
          <div
            key={question}
            className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-md space-y-2.5"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD3AC] mt-2 shrink-0" />
              <p className="text-sm font-semibold text-white leading-snug">
                {toTitleCase(question)}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
              <p className="text-xs sm:text-sm font-medium text-[#FFD3AC] leading-relaxed break-words">
                {typeof answer === 'object' && answer !== null ? JSON.stringify(answer) : String(answer)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <WebLayoutWrapper>
      <div className="space-y-6 pb-24">
        {/* Top Navigation */}
        <div className="flex items-center gap-4 pt-2">
          <AmbeBackButton onClick={() => router.back()} />
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            {displayName}'s Health Profile
          </h1>
        </div>

        {/* Dosha Scores Card */}
        {doshaScores && (
          <div>
            {renderSectionHeader('DOSHA CONSTITUTION')}
            <div className="bg-gradient-to-br from-[#FFD3AC] to-[#FFD3AC]/80 text-[#1E1E1E] rounded-2xl p-5 shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
                <SparklesIcon className="w-7 h-7 text-[#1E1E1E]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1E1E1E]/70 uppercase tracking-wider">
                  Constitution Type
                </p>
                <p className="text-xl sm:text-2xl font-bold text-[#1E1E1E] mt-0.5">
                  {primary} {doshaScores.secondary ? `/ ${secondary}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Basic Questionnaire Responses */}
        <div>
          {renderSectionHeader('BASIC QUESTIONNAIRE (DOSHA)')}
          {renderResultsList(basicResults)}
        </div>

        {/* Extended Health Assessment Responses */}
        {extendedResults && (
          <div>
            {renderSectionHeader('EXTENDED HEALTH ASSESSMENT')}
            {renderResultsList(extendedResults)}
          </div>
        )}
      </div>
    </WebLayoutWrapper>
  );
}