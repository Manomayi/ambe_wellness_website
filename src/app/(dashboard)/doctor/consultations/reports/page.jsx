// src/app/doctor/consultations/reports/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ChevronRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import AmbeBackButton from '@/components/common/AmbeBackButton';

// Matches the Flutter ReportsToFinishPage: list every pending report, tap one to complete it.
export default function DoctorReportsToFinishPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const reportsCol = collection(db, 'doctors', user.uid, 'appointments_reports_to_finish');
    const unsubscribe = onSnapshot(
      reportsCol,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => getMillis(a.time) - getMillis(b.time));
        setReports(list);
        setLoading(false);
      },
      (error) => {
        if (error?.code === 'permission-denied') return;
        console.error('Error listening to reports to finish:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const openReport = (r) => {
    const params = new URLSearchParams({
      userUid: r.user_id || r.user_uid || r.userId || r.userUid || '',
      userName: r.user_name || r.userName || r.patient_name || '',
      time: String(getMillis(r.time) || Date.now()),
    }).toString();
    router.push(`/doctor/consultations/complete-report/${encodeURIComponent(r.id)}?${params}`);
  };

  return (
    <ProtectedRoute userType="doctor">
      <div className="w-full pb-12 select-none">
        {/* Sticky Top Bar */}
        <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-3 sm:-mx-6 md:-mx-8 px-3 sm:px-6 md:px-8 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <AmbeBackButton onClick={() => router.push('/doctor/consultations')} />
            <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">
              Reports to Finish
            </h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent" />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-16 sm:py-24 text-center">
              <CheckCircleIcon className="w-16 h-16 text-[#FFD3AC]/70 mx-auto" />
              <h3 className="text-2xl font-heading font-bold text-white mt-5">
                All Caught Up!
              </h3>
              <p className="text-white/70 text-[15px] font-sans mt-2">
                No pending reports to finish
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => openReport(r)}
                  className="w-full bg-black/45 border border-white/[0.24] hover:border-[#FFD3AC]/40 rounded-2xl p-4 flex items-center justify-between transition text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-[14px] bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold font-sans text-base truncate">
                        {r.user_name || r.userName || r.patient_name || 'Client'}
                      </p>
                      <p className="text-white/70 text-[13px] font-sans mt-0.5">
                        {formatTime(r.time)}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 text-[#FFD3AC] shrink-0 ml-3 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function getMillis(ts) {
  if (!ts) return 0;
  if (ts.toMillis) return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  const ms = new Date(ts).getTime();
  return isNaN(ms) ? 0 : ms;
}

function formatTime(ts) {
  const ms = getMillis(ts);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms));
}
