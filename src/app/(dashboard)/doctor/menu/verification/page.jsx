// src/app/doctor/verification/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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

  const getBgColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-300';
      case 'Rejected':
        return 'bg-red-400';
      default:
        return 'bg-gray-500';
    }
  };

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
       
        <h1 className="text-2xl font-semibold text-gray-800">
          Verification Status
        </h1>
      </div>

      {/* Overall Status */}
      {overallStatus && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-2">
            Overall Status
          </p>
          <div className={`${getBgColor(overallStatus)} text-white p-4 rounded-lg shadow`}>
            {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          </div>
        </>
      )}

      {/* Documents */}
      <div>
        <p className="text-sm uppercase font-semibold text-gray-600 mb-2">
          Documents
        </p>
        {documentStatuses.length ? (
          <div className="space-y-4">
            {documentStatuses.map((docStatus, idx) => (
              <div
                key={idx}
                className={`${getBgColor(docStatus.status)} text-white p-4 rounded-lg shadow flex items-center justify-between`}
              >
                <div>
                  <h3 className="font-bold text-lg">Document {idx + 1}</h3>
                  <p className="capitalize mt-1">
                    {docStatus.status ?? 'Unknown'}
                  </p>
                </div>
                {docStatus.url ? (
                  <a
                    href={docStatus.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-white text-white px-3 py-1 rounded font-semibold hover:bg-white hover:text-black transition"
                  >
                    VIEW
                  </a>
                ) : (
                  <span className="opacity-50">N/A</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No documents uploaded.</p>
        )}
      </div>
    </div>
  );
}