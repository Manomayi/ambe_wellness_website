"use client";

import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function PatientHealthProfilePanel({
  userUid,
  userName = 'Client',
  onClose,
}) {
  const [loading, setLoading] = useState(true);
  const [doshaScores, setDoshaScores] = useState(null);
  const [basicResults, setBasicResults] = useState(null);
  const [extendedResults, setExtendedResults] = useState(null);

  useEffect(() => {
    if (!userUid) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [doshaSnap, extendedSnap] = await Promise.all([
          getDoc(doc(db, 'users', userUid, 'questionnaires', 'dosha_questionnaire')),
          getDoc(doc(db, 'users', userUid, 'questionnaires', 'extended')),
        ]);

        if (!isMounted) return;

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
        console.error('Error loading patient questionnaire data:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [userUid]);

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

  const displayName = userName.trim() ? userName.split(' ')[0] : 'Client';
  const primary = toTitleCase(doshaScores?.primary || 'N/A');
  const secondary = toTitleCase(doshaScores?.secondary || 'N/A');

  const renderSubsectionHeader = (title) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-[#FFD3AC]" />
      <h3 className="text-xs font-bold text-[#FFD3AC] tracking-wider uppercase font-sans">
        {title}
      </h3>
    </div>
  );

  const renderEmptyState = (message) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
      <p className="text-xs sm:text-sm text-white/60 font-sans">{message}</p>
    </div>
  );

  const renderResultsSection = (resultsMap) => {
    if (!resultsMap || Object.keys(resultsMap).length === 0) {
      return renderEmptyState('No responses recorded.');
    }

    return (
      <div className="space-y-2.5">
        {Object.entries(resultsMap).map(([question, answer]) => (
          <div
            key={question}
            className="bg-[#121212]/90 border border-white/10 rounded-xl px-3.5 py-3 shadow-sm"
          >
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFD3AC] mt-1.5 shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-white/90 leading-snug">
                {toTitleCase(question)}
              </p>
            </div>
            <div className="mt-2 w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2">
              <p className="text-xs font-medium text-[#FFD3AC] leading-relaxed break-words">
                {formatAnswer(answer)}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1E1E1E]/90 shrink-0">
        <div className="min-w-0 pr-3">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-white truncate">
            {displayName}&apos;s Health Profile
          </h2>
          <p className="text-[11px] text-white/60">
            Dosha assessment &amp; clinical health questionnaire
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Health Profile"
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer shrink-0"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFD3AC] border-t-transparent animate-spin" />
            <p className="text-xs text-white/60">Loading profile data...</p>
          </div>
        ) : (
          <>
            {/* 1. Basic Questionnaire (Dosha) */}
            <section>
              {renderSubsectionHeader('BASIC QUESTIONNAIRE (DOSHA)')}

              {!doshaScores && (!basicResults || Object.keys(basicResults).length === 0) ? (
                renderEmptyState('No basic questionnaire data available.')
              ) : (
                <div className="space-y-3">
                  {/* Dosha Scores Card */}
                  {doshaScores && (
                    <div className="bg-gradient-to-br from-[#FFD3AC] to-[#f4be92] text-black/90 rounded-2xl p-4 shadow-md flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
                        <SparklesIcon className="w-6 h-6 text-black/80" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-black/60 uppercase tracking-wider">
                          Constitution Type
                        </p>
                        <p className="font-serif text-xl font-bold text-black/90 truncate">
                          {primary} {doshaScores.secondary ? `/ ${secondary}` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {basicResults && Object.keys(basicResults).length > 0 && (
                    <div className="pt-1">
                      <h4 className="text-[11px] font-semibold text-white/70 tracking-wider uppercase mb-2">
                        Responses
                      </h4>
                      {renderResultsSection(basicResults)}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 2. Extended Health Assessment */}
            <section className="pt-2 border-t border-white/10">
              {renderSubsectionHeader('EXTENDED HEALTH ASSESSMENT')}

              {!extendedResults || Object.keys(extendedResults).length === 0 ? (
                renderEmptyState('Extended assessment not completed yet.')
              ) : (
                renderResultsSection(extendedResults)
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
