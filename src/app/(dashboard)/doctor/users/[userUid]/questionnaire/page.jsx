// src/app/(dashboard)/doctor/users/[userUid]/questionnaire/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { SparklesIcon } from '@heroicons/react/24/outline';
import AmbeBackButton from '@/components/common/AmbeBackButton';

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
    const unsub = onAuthStateChanged(auth, async (user) => {
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
          const data = doshaSnap.data() || {};
          setDoshaScores(data.dosha_scores || null);
          setBasicResults(data.results || null);
        }

        if (extendedSnap.exists()) {
          const data = extendedSnap.data() || {};
          setExtendedResults(data.results || null);
        }
      } catch (e) {
        console.error('Error loading questionnaire data:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [userUid, router]);

  const toTitleCase = (str) =>
    (str || '')
      .replace(/_/g, ' ')
      .replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );

  const formatAnswer = (val) => {
    if (val === null || val === undefined || val === '') return 'Skipped';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) {
      if (val.length === 0) return 'None';
      return val
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join(', ');
    }
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([k, v]) => `${toTitleCase(k)}: ${formatAnswer(v)}`)
        .join(', ');
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin h-9 w-9 rounded-full border-2 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  const displayName = userName.trim() ? userName.split(' ')[0] : 'User';
  const primary = toTitleCase(doshaScores?.primary || 'N/A');
  const secondary = toTitleCase(doshaScores?.secondary || 'N/A');

  const renderSubsectionHeader = (title) => (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-[3.5px] h-[18px] rounded-sm bg-[#FFD3AC]" />
      <h2 className="text-sm font-bold text-[#FFD3AC] tracking-wider uppercase font-sans">
        {title}
      </h2>
    </div>
  );

  const renderEmptyState = (message) => (
    <div className="bg-black/35 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm">
      <p className="text-sm text-white/60 font-sans">{message}</p>
    </div>
  );

  const renderResultsSection = (resultsMap) => {
    if (!resultsMap || Object.keys(resultsMap).length === 0) {
      return renderEmptyState('No responses recorded.');
    }

    return (
      <div>
        <h3 className="text-xs font-bold text-white/70 tracking-wider uppercase font-sans mb-3">
          QUESTIONNAIRE RESPONSES
        </h3>
        <div className="space-y-3">
          {Object.entries(resultsMap).map(([question, answer]) => (
            <div
              key={question}
              className="bg-black/45 border border-white/12 rounded-2xl px-4 py-3.5 backdrop-blur-md shadow-md"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD3AC] mt-1.5 shrink-0" />
                <p className="text-[15px] font-semibold text-white leading-snug font-sans">
                  {toTitleCase(question)}
                </p>
              </div>
              <div className="mt-2.5 w-full bg-white/5 border border-white/8 rounded-xl px-3.5 py-2.5">
                <p className="text-sm font-medium text-[#FFD3AC] leading-relaxed break-words font-sans">
                  {formatAnswer(answer)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12 pt-2 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      {/* Top Bar with Centered Serif Title matching Flutter AppBar */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute left-0">
          <AmbeBackButton
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/doctor/users');
              }
            }}
          />
        </div>
        <h1 className="font-serif text-2xl font-bold tracking-wide text-white text-center">
          {displayName}&apos;s Health Profile
        </h1>
      </div>

      {/* 1. Basic/Dosha Questionnaire */}
      <div>
        {renderSubsectionHeader('BASIC QUESTIONNAIRE (DOSHA)')}

        {!doshaScores && (!basicResults || Object.keys(basicResults).length === 0) ? (
          renderEmptyState('No basic questionnaire data available.')
        ) : (
          <div className="space-y-4">
            {/* Dosha Scores Card */}
            {doshaScores && (
              <div>
                <h3 className="text-xs font-bold text-white/70 tracking-wider uppercase font-sans mb-3">
                  DOSHA SCORES
                </h3>
                <div className="bg-gradient-to-br from-[#FFD3AC]/95 to-[#FFD3AC]/75 text-black/90 rounded-2xl p-5 shadow-lg flex items-center gap-4">
                  <div className="w-13 h-13 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
                    <SparklesIcon className="w-7 h-7 text-black/80" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-black/60 uppercase tracking-wider font-sans">
                      Constitution Type
                    </p>
                    <p className="font-serif text-2xl font-bold text-black/90 mt-0.5">
                      {primary} {doshaScores.secondary ? `/ ${secondary}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {basicResults && Object.keys(basicResults).length > 0 && (
              renderResultsSection(basicResults)
            )}
          </div>
        )}
      </div>

      {/* 2. Extended Health Assessment */}
      <div className="pt-2">
        {renderSubsectionHeader('EXTENDED HEALTH ASSESSMENT')}

        {!extendedResults || Object.keys(extendedResults).length === 0 ? (
          renderEmptyState('Extended assessment not completed yet.')
        ) : (
          renderResultsSection(extendedResults)
        )}
      </div>
    </div>
  );
}