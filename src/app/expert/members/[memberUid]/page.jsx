// src/app/expert/members/[memberUid]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function MemberCompleteProfilePage() {
  const router = useRouter();
  const { memberUid } = useParams();
  const searchParams = useSearchParams();
  const memberName = searchParams.get('name');

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!memberUid) return;

      try {
        const hist = query(
          collection(db, 'patients', memberUid, 'appointments_history'),
          orderBy('time', 'desc')
        );
        const snap = await getDocs(hist);
        setAppointments(
          snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        );
      } catch (e) {
        console.error('Error loading history:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [memberUid, router]);

  const fmt = ts => {
    const d = ts?.toDate?.();
    return d?.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-12 w-12 rounded-full 
                        border-4 border-t-4 border-green-600 
                        border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <h1 className="text-2xl font-semibold text-gray-800">
          {memberName}
        </h1>
      </div>

      {/* Questionnaire Section */}
      <div className="space-y-2">
        <p className="text-sm uppercase font-semibold text-gray-600">
          Questionnaire
        </p>
        <button
          onClick={() =>
            router.push(
              `/expert/members/${memberUid}/questionnaire?name=${encodeURIComponent(memberName)}`
            )
          }
          className="w-full bg-white border-l-4 border-green-600 
                     shadow rounded-lg p-4 flex justify-between items-center 
                     hover:shadow-md transition"
        >
          <span className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-green-600" />
            <span className="font-medium text-gray-800">
              View Questionnaire
            </span>
          </span>
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Consultation History */}
      <div className="space-y-2">
        <p className="text-sm uppercase font-semibold text-gray-600">
          Consultation History
        </p>
        {appointments.length === 0 ? (
          <p className="text-gray-600">No appointment history found.</p>
        ) : (
          <div className="space-y-4">
            {appointments.map(app => (
              <button
                key={app.id}
                onClick={() =>
                  router.push(
                    `/expert/consultations/report/${app.id}` +
                    `?patientUid=${app.patient_id}` +
                    `&patientName=${encodeURIComponent(memberName)}` +
                    `&doctorName=${encodeURIComponent(app.doctor_name)}`
                  )
                }
                className="w-full bg-white border-l-4 border-green-600 
                           shadow rounded-lg p-4 flex justify-between items-center 
                           hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    Dr. {app.doctor_name}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {fmt(app.time)}
                  </p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}