// src/app/(dashboard)/doctor/menu/verification/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function DoctorVerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState(null);
  const [documentStatuses, setDocumentStatuses] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);

      // Realtime listener for verification document
      const unsubDoc = onSnapshot(
        doc(db, 'verification', u.uid),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() || {};
            setOverallStatus(data.overall_status || 'Under Review');
            setDocumentStatuses(
              Array.isArray(data.document_statuses) ? data.document_statuses : []
            );
          } else {
            // Default pending/review if no verification document yet
            setOverallStatus('Under Review');
            setDocumentStatuses([
              { name: 'Document 1', status: 'Under Review' },
              { name: 'Document 2', status: 'Under Review' },
            ]);
          }
          setLoading(false);
        },
        (err) => {
          if (err?.code === 'permission-denied') return;
          console.error('Error listening to verification doc:', err);
          setLoading(false);
        }
      );

      return () => unsubDoc();
    });

    return () => unsub();
  }, [router]);

  const capitalize = (str) => {
    if (!str) return 'Under Review';
    const clean = str.replace(/_/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const isApprovedStatus = (status) =>
    status && status.toLowerCase() === 'approved';
  const isRejectedStatus = (status) =>
    status && status.toLowerCase() === 'rejected';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin h-9 w-9 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  const overallIsApproved = isApprovedStatus(overallStatus);
  const overallIsRejected = isRejectedStatus(overallStatus);
  const capitalizedOverall = capitalize(overallStatus);

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12 pt-2 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      {/* Top Bar with Centered Title matching Flutter AppBar */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute left-0">
          <AmbeBackButton
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/doctor/menu');
              }
            }}
          />
        </div>
        <h1 className="font-serif text-2xl font-normal tracking-wide text-white">
          Verification Status
        </h1>
      </div>

      {/* OVERALL STATUS Header & Banner */}
      <div className="space-y-2">
        <h2 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider px-1">
          OVERALL STATUS
        </h2>

        {/* Overall Status Banner matching mobile app */}
        <div
          className={`rounded-2xl p-4 sm:p-5 flex items-center shadow-lg transition-all ${
            overallIsApproved
              ? 'bg-gradient-to-br from-[#FFD3AC] to-[#F5C59F]'
              : overallIsRejected
              ? 'bg-gradient-to-br from-red-600 to-red-700'
              : 'bg-[#2A2A2E] border border-white/5'
          }`}
        >
          {/* Status Icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${
              overallIsApproved || overallIsRejected
                ? 'bg-black/20 text-white'
                : 'bg-[#3A3A3E] text-[#FFD3AC]'
            }`}
          >
            {overallIsApproved ? (
              <CheckCircleIcon className="w-7 h-7 stroke-[1.8]" />
            ) : overallIsRejected ? (
              <XCircleIcon className="w-7 h-7 stroke-[1.8]" />
            ) : (
              <ClockIcon className="w-7 h-7 stroke-[1.8]" />
            )}
          </div>

          {/* Text Info */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${
                overallIsApproved || overallIsRejected
                  ? 'text-white/90'
                  : 'text-neutral-400'
              }`}
            >
              Overall Status
            </p>
            <p
              className={`text-2xl font-bold tracking-wide mt-0.5 ${
                overallIsApproved || overallIsRejected
                  ? 'text-white'
                  : 'text-white'
              }`}
            >
              {capitalizedOverall}
            </p>
          </div>
        </div>
      </div>

      {/* DOCUMENTS Section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs uppercase font-semibold text-neutral-400 tracking-wider px-1">
          DOCUMENTS
        </h2>

        {documentStatuses.length > 0 ? (
          <div className="space-y-3">
            {documentStatuses.map((docItem, idx) => {
              const docStatus = docItem.status || 'Under Review';
              const isDocApproved = isApprovedStatus(docStatus);
              const isDocRejected = isRejectedStatus(docStatus);
              const docTitle = docItem.name || `Document ${idx + 1}`;

              return (
                <div
                  key={idx}
                  className={`bg-[#2A2A2E] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md transition-all ${
                    isDocApproved
                      ? 'border border-[#FFD3AC]/30'
                      : isDocRejected
                      ? 'border border-red-500/30'
                      : 'border border-white/5'
                  }`}
                >
                  {/* Left Icon */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isDocApproved
                          ? 'bg-[#FFD3AC]/15 text-[#FFD3AC]'
                          : isDocRejected
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-white/5 text-neutral-400'
                      }`}
                    >
                      {isDocApproved ? (
                        <CheckIcon className="w-5 h-5 stroke-[2.2]" />
                      ) : isDocRejected ? (
                        <XMarkIcon className="w-5 h-5 stroke-[2.2]" />
                      ) : (
                        <ClockIcon className="w-5 h-5 stroke-[2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white truncate">
                        {docTitle}
                      </p>
                      <p
                        className={`text-sm mt-0.5 ${
                          isDocApproved
                            ? 'text-[#FFD3AC]/90 font-medium'
                            : isDocRejected
                            ? 'text-red-400 font-medium'
                            : 'text-neutral-400'
                        }`}
                      >
                        {capitalize(docStatus)}
                      </p>
                    </div>
                  </div>

                  {/* Right View Button */}
                  <div>
                    {docItem.url ? (
                      <a
                        href={docItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2 rounded-full border border-[#FFD3AC]/50 text-[#FFD3AC] hover:bg-[#FFD3AC]/10 text-xs font-bold tracking-wider uppercase transition inline-block text-center"
                      >
                        VIEW
                      </a>
                    ) : (
                      <button
                        type="button"
                        className="px-5 py-2 rounded-full border border-white/10 text-neutral-400 text-xs font-bold tracking-wider uppercase cursor-default"
                      >
                        VIEW
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#2A2A2E] border border-white/5 rounded-2xl p-8 text-center">
            <p className="text-neutral-400 text-sm">No documents found.</p>
          </div>
        )}
      </div>
    </div>
  );
}