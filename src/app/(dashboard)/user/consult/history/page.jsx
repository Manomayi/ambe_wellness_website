"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import Link from "next/link";
import {
  ChevronRightIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import WebLayoutWrapper from "@/components/common/WebLayoutWrapper";
import AmbeBackButton from "@/components/common/AmbeBackButton";
import { getConsultationStatusInfo } from "@/lib/consultationStatus";

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
        const uniqueMap = {};
        snap.docs.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() };
          const canonicalId = data.appointment_id || data.consultation_id || doc.id;
          if (!uniqueMap[canonicalId]) {
            uniqueMap[canonicalId] = data;
          }
        });
        setHistory(Object.values(uniqueMap));
      } catch (e) {
        console.error("Error fetching history:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <WebLayoutWrapper maxWidth="760px">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 border-3 border-[#FFD3AC] border-t-transparent rounded-full animate-spin" />
        </div>
      </WebLayoutWrapper>
    );
  }

  return (
    <WebLayoutWrapper maxWidth="760px">
      <div className="space-y-6 pb-16">
        {/* Sticky Top Header matching Flutter UnifiedHistoryPage */}
        <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <AmbeBackButton />
            <h1
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Consultation History
            </h1>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="bg-[#1B1A18]/65 border border-white/15 rounded-[22px] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 flex items-center justify-center text-[#FFD3AC] mx-auto">
              <VideoCameraIcon className="w-6 h-6" />
            </div>
            <p className="text-white/70 text-base font-sans">
              No history available.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {history.map((appt) => {
              const statusInfo = getConsultationStatusInfo(appt);
              const doctorName = appt.doctor_name?.startsWith("Dr.")
                ? appt.doctor_name
                : `Dr. ${appt.doctor_name || "Assigned Doctor"}`;

              return (
                <Link
                  key={appt.id}
                  href={
                    `/user/consult/report/${appt.id}` +
                    `?doctorName=${encodeURIComponent(appt.doctor_name || "")}`
                  }
                  className="
                    block bg-[#1B1A18]/65 border border-white/15 rounded-[20px] p-4 sm:p-5
                    hover:border-[#FFD3AC]/50 hover:bg-[#1B1A18]/80 transition-all duration-200 group
                  "
                >
                  <div className="flex items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 flex items-center justify-center text-[#FFD3AC] flex-shrink-0">
                        <VideoCameraIcon className="w-5 h-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-white text-base truncate font-sans">
                          Consultation with {doctorName}
                        </h3>
                        <p className="text-white/55 text-xs sm:text-sm mt-0.5 font-sans">
                          {formatTime(appt.time)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusInfo.badgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`} />
                        {statusInfo.label}
                      </span>
                      <ChevronRightIcon className="h-5 w-5 text-white/40 group-hover:text-white transition" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </WebLayoutWrapper>
  );
}

