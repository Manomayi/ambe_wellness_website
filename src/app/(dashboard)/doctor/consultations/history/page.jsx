// src/app/doctor/consultations/history/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, getDocs, where } from "firebase/firestore";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import AmbeBackButton from '@/components/common/AmbeBackButton';

function UserAvatarIcon() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 flex items-center justify-center shrink-0">
      <svg className="w-6 h-6 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    </div>
  );
}

function getStatusBadge(appointment) {
  const rawStatus = (appointment.status || "").toString().toLowerCase().trim();
  const cancelledBy = (appointment.cancelled_by || appointment.cancelledBy || "").toString().toLowerCase().trim();

  // 1. Cancelled Scenarios
  if (rawStatus.includes("cancel") || cancelledBy) {
    const isDocCancel =
      rawStatus.includes("doctor") ||
      rawStatus.includes("admin") ||
      rawStatus === "cancelled_doctor_deleted" ||
      cancelledBy === "doctor" ||
      cancelledBy === "admin";

    if (isDocCancel) {
      return {
        label: "Cancelled by You",
        className: "bg-[#9E9E9E]/15 text-[#BDBDBD]",
      };
    }
    return {
      label: "Cancelled by Patient",
      className: "bg-[#E57373]/15 text-[#EF5350]",
    };
  }

  // 2. Missed / No-Show Scenarios
  if (
    rawStatus.includes("missed") ||
    rawStatus === "no_show" ||
    rawStatus.includes("no-show")
  ) {
    if (rawStatus.includes("doctor")) {
      return {
        label: "Doctor Absent",
        className: "bg-[#FF9800]/15 text-[#FFA726]",
      };
    }
    return {
      label: "Missed",
      className: "bg-[#FF9800]/15 text-[#FFA726]",
    };
  }

  // 3. Completed (default for history)
  return {
    label: "Completed",
    className: "bg-[#4CAF50]/15 text-[#4CAF50]",
  };
}

let cachedHistory = null;
let cachedDoctorUid = null;

export default function DoctorConsultationHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState(() => {
    if (cachedHistory && Array.isArray(cachedHistory) && cachedHistory.length > 0) {
      return cachedHistory;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("doctor_history_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (_) {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (cachedHistory && Array.isArray(cachedHistory) && cachedHistory.length > 0) {
      return false;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("doctor_history_cache");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return false;
        }
      } catch (_) {}
    }
    return true;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      if (cachedDoctorUid && cachedDoctorUid !== user.uid) {
        cachedHistory = null;
        try {
          sessionStorage.removeItem("doctor_history_cache");
        } catch (_) {}
      }
      cachedDoctorUid = user.uid;

      try {
        const items = [];

        const getMillis = (obj) => {
          if (!obj) return 0;
          const val =
            obj.time || obj.scheduled_at || obj.cancelled_at || obj.created_at;
          if (!val) return 0;
          if (val.toMillis) return val.toMillis();
          if (val.toDate) return val.toDate().getTime();
          if (val instanceof Date) return val.getTime();
          if (typeof val === "number") return val;
          return 0;
        };

        const isSameConsultation = (a, b) => {
          if (!a || !b) return false;
          if (a.id && b.id && a.id === b.id) return true;
          if (
            a.history_appointment_id &&
            (a.history_appointment_id === b.id ||
              a.history_appointment_id === b.history_appointment_id)
          ) {
            return true;
          }
          if (b.history_appointment_id && b.history_appointment_id === a.id) {
            return true;
          }
          if (
            a.appointment_id &&
            (a.appointment_id === b.id ||
              a.appointment_id === b.appointment_id)
          ) {
            return true;
          }
          if (b.appointment_id && b.appointment_id === a.id) {
            return true;
          }
          if (
            a.consultation_id &&
            (a.consultation_id === b.id ||
              a.consultation_id === b.consultation_id)
          ) {
            return true;
          }
          if (b.consultation_id && b.consultation_id === a.id) {
            return true;
          }

          // Match by patient ID and scheduled time within 2 minutes
          const userA = (a.user_id || a.userId || a.user_uid || "").toString();
          const userB = (b.user_id || b.userId || b.user_uid || "").toString();
          if (userA && userB && userA === userB) {
            const timeA = getMillis(a);
            const timeB = getMillis(b);
            if (timeA > 0 && timeB > 0 && Math.abs(timeA - timeB) <= 2 * 60 * 1000) {
              return true;
            }
          }

          return false;
        };

        const addOrMerge = (newItem) => {
          const existingIdx = items.findIndex((existing) =>
            isSameConsultation(existing, newItem)
          );
          if (existingIdx >= 0) {
            const existing = items[existingIdx];
            const newStatus = (newItem.status || "").toString();
            const existStatus = (existing.status || "").toString();
            const isCancelled =
              newStatus.includes("cancel") || existStatus.includes("cancel");

            items[existingIdx] = {
              ...existing,
              ...newItem,
              recommendations:
                newItem.recommendations || existing.recommendations,
              store_recommendations:
                newItem.store_recommendations || existing.store_recommendations,
              notes: newItem.notes || existing.notes,
              referral: newItem.referral || existing.referral,
              status: isCancelled
                ? (newStatus.includes("cancel") ? newStatus : existStatus)
                : (existStatus || newStatus),
              cancelled_by: newItem.cancelled_by || existing.cancelled_by,
              cancelled_at: newItem.cancelled_at || existing.cancelled_at,
              cancellation_reason:
                newItem.cancellation_reason ||
                existing.cancellation_reason ||
                newItem.note ||
                existing.note,
              id:
                (existing.recommendations || existing.notes)
                  ? existing.id
                  : (newItem.recommendations || newItem.notes)
                  ? newItem.id
                  : (existing.history_appointment_id || newItem.history_appointment_id || existing.id || newItem.id),
              user_id: existing.user_id || newItem.user_id || existing.userId || newItem.userId,
              user_name: existing.user_name || newItem.user_name || existing.userName || newItem.userName,
              doctor_name: existing.doctor_name || newItem.doctor_name,
              time: existing.time || newItem.time || existing.scheduled_at || newItem.scheduled_at,
            };
          } else {
            items.push(newItem);
          }
        };

        // Fetch all 4 sources in PARALLEL for maximum speed
        const [histRes, qDocIdRes, qDocUidRes, qDoctorIdRes] = await Promise.allSettled([
          getDocs(collection(db, "doctors", user.uid, "appointments_history")),
          getDocs(query(collection(db, "consultations"), where("doctor_id", "==", user.uid))),
          getDocs(query(collection(db, "consultations"), where("doctor_uid", "==", user.uid))),
          getDocs(query(collection(db, "consultations"), where("doctorId", "==", user.uid))),
        ]);

        if (histRes.status === "fulfilled") {
          histRes.value.forEach((docSnap) => {
            const data = docSnap.data();
            addOrMerge({
              id: docSnap.id,
              document_id: docSnap.id,
              history_appointment_id: docSnap.id,
              ...data,
            });
          });
        }

        const handleConsultationSnap = (snap) => {
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const status = (data.status || "").toString().toLowerCase();
            if (status === "upcoming" || status === "scheduled" || status === "in_progress") {
              return;
            }
            addOrMerge({
              id: docSnap.id,
              document_id: docSnap.id,
              ...data,
            });
          });
        };

        if (qDocIdRes.status === "fulfilled") handleConsultationSnap(qDocIdRes.value);
        if (qDocUidRes.status === "fulfilled") handleConsultationSnap(qDocUidRes.value);
        if (qDoctorIdRes.status === "fulfilled") handleConsultationSnap(qDoctorIdRes.value);

        // Sort descending by time
        items.sort((a, b) => getMillis(b) - getMillis(a));
        cachedHistory = items;
        try {
          sessionStorage.setItem("doctor_history_cache", JSON.stringify(items));
        } catch (_) {}
        setHistory(items);
      } catch (e) {
        console.error("Error fetching doctor consultation history:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 py-4">
      <div className="flex items-center gap-3">
        <AmbeBackButton onClick={() => router.push('/doctor/consultations')} />
        <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">
          Consultation History
        </h1>
      </div>

      {history.length === 0 ? (
        <div className="bg-white/[0.08] border border-white/[0.12] rounded-[20px] p-10 text-center">
          <p className="text-gray-400 font-sans">No consultation history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((appt) => {
            const badge = getStatusBadge(appt);
            const timeVal =
              appt.time ||
              appt.scheduled_at ||
              appt.cancelled_at ||
              appt.created_at;
            return (
              <button
                key={appt.id}
                onClick={() => {
                  try {
                    const serialized = JSON.stringify(appt);
                    sessionStorage.setItem("report_cache_" + appt.id, serialized);
                    if (appt.history_appointment_id) {
                      sessionStorage.setItem("report_cache_" + appt.history_appointment_id, serialized);
                    }
                    if (appt.document_id) {
                      sessionStorage.setItem("report_cache_" + appt.document_id, serialized);
                    }
                    sessionStorage.setItem("last_selected_report", serialized);
                  } catch (_) {}

                  const params = new URLSearchParams({
                    userUid: appt.user_id || appt.userId || appt.user_uid || "",
                    userName: appt.user_name || "",
                    doctorName: appt.doctor_name || "",
                    historyId: appt.history_appointment_id || appt.document_id || "",
                    appointmentId: appt.appointment_id || appt.consultation_id || "",
                  }).toString();

                  router.push(
                    `/doctor/consultations/report/${encodeURIComponent(appt.id)}?${params}`
                  );
                }}
                className="w-full bg-white/[0.08] border border-white/[0.12] hover:border-[#FFD3AC]/40 rounded-[20px] p-4 sm:p-5 flex items-center justify-between transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatarIcon />
                  <div className="min-w-0">
                    <p className="text-white font-semibold font-sans text-base truncate">
                      {appt.user_name || "Patient"}
                    </p>
                    <p className="text-white/50 text-[13px] font-sans mt-0.5">
                      {formatTime(timeVal)}
                    </p>
                    <div className="mt-1.5">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-white/50 shrink-0 ml-3 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
