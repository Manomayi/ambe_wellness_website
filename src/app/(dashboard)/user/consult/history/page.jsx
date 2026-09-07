"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import BackButton from '@/components/common/BackButton'
import { getConsultationStatusInfo } from "@/lib/consultationStatus"

export default function ConsultationHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      try {
        const histQuery = query(
          collection(db, "users", user.uid, "appointments_history"),
          orderBy("time", "desc")
        );
        const snap = await getDocs(histQuery);
        const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setHistory(items);
      } catch (e) {
        console.error("Error fetching history:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const formatTime = (ts) => {
    const d = ts.toDate ? ts.toDate() : ts;
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton />
      <h1 className="text-2xl font-bold text-[#1A1A1A]">
        Consultation History
      </h1>
      {history.length === 0 ? (
        <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 text-center shadow-sm">
          <p className="text-sm text-[#6B6862]">No appointment history found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((appt) => {
            const statusInfo = getConsultationStatusInfo(appt);
            return (
              <div key={appt.id} className="bg-white shadow rounded-lg border border-[#E7E2D9]">
                <Link
                  href={
                    `/user/consult/report/${appt.id}` +
                    `?doctorName=${encodeURIComponent(appt.doctor_name || '')}`
                  }
                  className="w-full block text-left flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-medium text-gray-800">
                        {appt.doctor_name?.startsWith('Dr.') ? appt.doctor_name : `Dr. ${appt.doctor_name || 'Assigned Doctor'}`}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {formatTime(appt.time)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#C8996A] font-medium ml-4 shrink-0">
                    <span>{statusInfo.actionText}</span>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
