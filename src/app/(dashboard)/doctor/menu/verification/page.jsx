// src/app/doctor/verification/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';

export default function DoctorVerificationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState(null);
  const [documentStatuses, setDocumentStatuses] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'verification', user.uid));
        const data = snap.data() || {};
        setOverallStatus(data.overall_status ?? null);
        setDocumentStatuses(Array.isArray(data.document_statuses)
          ? data.document_statuses
          : []
        );
      } catch (e) {
        console.error('Error loading verification data:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold tracking-wider font-sans">
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold tracking-wider font-sans">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-[#FFD3AC]/20 text-[#FFD3AC] border border-[#FFD3AC]/30 text-xs font-semibold tracking-wider font-sans">
            Under Review
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-bold font-sans flex-1">
          Verification Status
        </h1>
      </div>

      {/* Overall Status */}
      {overallStatus && (
        <div className="space-y-2">
          <p className="text-xs uppercase font-semibold text-gray-400 px-1 font-sans">
            Overall Status
          </p>
          <div className="bg-[#1B1A18]/80 border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-md">
            <div>
              <p className="font-semibold text-white font-sans text-base">Account Review</p>
              <p className="text-xs text-gray-400 font-sans mt-0.5">Your medical license and credential status</p>
            </div>
            {getStatusBadge(overallStatus)}
          </div>
        </div>
      )}

      {/* Documents */}
      <div className="space-y-3">
        <p className="text-xs uppercase font-semibold text-gray-400 px-1 font-sans">
          Documents
        </p>
        {documentStatuses.length ? (
          <div className="space-y-3">
            {documentStatuses.map((docStatus, idx) => (
              <div
                key={idx}
                className="bg-[#1B1A18]/80 border border-white/10 p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-md"
              >
                <div>
                  <h3 className="font-semibold text-white font-sans text-sm">Document {idx + 1}</h3>
                  <div className="mt-1">
                    {getStatusBadge(docStatus.status)}
                  </div>
                </div>
                {docStatus.url ? (
                  <a
                    href={docStatus.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 rounded-full bg-[#2D2D30] text-white border border-white/10 hover:bg-[#3D3D42] text-xs font-semibold font-sans transition"
                  >
                    View
                  </a>
                ) : (
                  <span className="text-xs text-gray-500 font-sans">N/A</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm font-sans">No documents uploaded.</p>
          </div>
        )}
      </div>
    </div>
  );
}