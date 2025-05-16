'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import {
  ChevronRightIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function ExpertConsultationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [reportsCount, setReportsCount] = useState(0);
  const [current, setCurrent] = useState(null);
  const [upcoming, setUpcoming] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) return router.push('/login');

    const uid = user.uid;

    // 1. Reports to finish
    try {
      const repSnap = await getDoc(doc(db, 'doctors', uid, 'appointments', 'reports_to_finish'));
      if (repSnap.exists()) {
        const data = repSnap.data();
        setReportsCount(Array.isArray(data.reports) ? data.reports.length : 0);
      }
    } catch (e) {
      console.error('Err loading reports:', e);
    }

    // 2. Upcoming appointments
    try {
      const apptSnap = await getDocs(
        query(
          collection(db, 'doctors', uid, 'appointments_upcoming'),
          orderBy('time', 'asc')
        )
      );
      const now = Date.now();
      const docs = apptSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      let curr = null, upc = [];
      for (let a of docs) {
        const t = a.time?.toDate?.().getTime() ?? 0;
        if (now >= t && now <= t + 3600_000) {
          curr = a;
        } else {
          upc.push(a);
        }
      }
      setCurrent(curr);
      setUpcoming(upc);
    } catch (e) {
      console.error('Err loading appointments:', e);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) return router.push('/login');
      loadData();
    });
    return unsub;
  }, [loadData, router]);

  const fmt = ts => {
    const d = ts?.toDate?.() ?? ts;
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Consultations</h1>
        <button
          onClick={loadData}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowPathIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Reports to finish */}
      {reportsCount > 0 && (
        <div className="space-y-2">
          <p className="text-sm uppercase font-semibold text-gray-600">
            Reports to Finish
          </p>
          <button
            onClick={() => router.push('/expert/reports-to-finish')}
            className="w-full bg-white border-l-4 border-red-500 shadow rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Reports to finish
              </p>
              <p className="text-gray-600">
                You have {reportsCount} report{reportsCount>1?'s':''}
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      )}

      {/* Happening Now */}
      {current && (
        <div className="space-y-2">
          <p className="text-sm uppercase font-semibold text-gray-600">
            Happening Now
          </p>
          <button
            onClick={() =>
              router.push(`/expert/consultations/join/${current.id}`)
            }
            className="w-full bg-white border-l-4 border-blue-600 shadow rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
          >
            <div>
              <p className="text-lg font-semibold text-gray-800">
                {current.patient_name}
              </p>
              <p className="text-gray-600">{fmt(current.time)}</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded">
              Join
            </span>
          </button>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm uppercase font-semibold text-gray-600">
            Upcoming
          </p>
          <div className="space-y-4">
            {upcoming.map(a => (
              <button
                key={a.id}
                onClick={() =>
                  router.push(`/expert/consultations/edit/${a.id}`)
                }
                className="w-full bg-white border-l-4 border-green-600 shadow rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    {a.patient_name}
                  </p>
                  <p className="text-gray-600">{fmt(a.time)}</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded">
                  Edit
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {reportsCount === 0 && !current && upcoming.length === 0 && (
        <p className="text-gray-600">No consultations to show.</p>
      )}
    </div>
  );
}