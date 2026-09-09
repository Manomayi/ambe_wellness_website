// src/app/doctor/consultations/history/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs, where, doc, setDoc } from "firebase/firestore";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import BackButton from '@/components/common/BackButton';
import { getConsultationStatusInfo } from "@/lib/consultationStatus";

export default function DoctorConsultationHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
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
          const userA = a.user_id || a.userId;
          const userB = b.user_id || b.userId;
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
            const isCancelled =
              (newItem.status && newItem.status.includes("cancel")) ||
              (existing.status && existing.status.includes("cancel"));
            items[existingIdx] = {
              ...existing,
              ...newItem,
              // Retain clinical report fields if existing has them
              recommendations:
                existing.recommendations || newItem.recommendations,
              store_recommendations:
                existing.store_recommendations || newItem.store_recommendations,
              notes: existing.notes || newItem.notes,
              referral: existing.referral || newItem.referral,
              // Retain cancellation fields if either has them
              status: isCancelled
                ? (newItem.status && newItem.status.includes("cancel")
                    ? newItem.status
                    : existing.status)
                : (existing.status || newItem.status),
              cancelled_by: newItem.cancelled_by || existing.cancelled_by,
              cancelled_at: newItem.cancelled_at || existing.cancelled_at,
              cancellation_reason:
                newItem.cancellation_reason ||
                existing.cancellation_reason ||
                newItem.note ||
                existing.note,
              // Prefer ID with clinical report data, or history_appointment_id
              id: (existing.recommendations || existing.notes)
                ? existing.id
                : (newItem.recommendations || newItem.notes)
                ? newItem.id
                : (existing.history_appointment_id || newItem.history_appointment_id || existing.id || newItem.id),
              history_appointment_id:
                existing.history_appointment_id || newItem.history_appointment_id || null,
              appointment_id:
                existing.appointment_id || newItem.appointment_id || null,
              document_id:
                existing.document_id || newItem.document_id || null,
              user_id: existing.user_id || newItem.user_id,
              user_name: existing.user_name || newItem.user_name,
              doctor_name: existing.doctor_name || newItem.doctor_name,
              time:
                existing.time ||
                newItem.time ||
                existing.scheduled_at ||
                newItem.scheduled_at,
            };
          } else {
            items.push(newItem);
          }
        };

        // 1. Fetch from doctors/{user.uid}/appointments_history
        try {
          const histQuery = query(
            collection(db, "doctors", user.uid, "appointments_history"),
            orderBy("time", "desc")
          );
          const snap = await getDocs(histQuery);
          snap.docs.forEach((d) => {
            addOrMerge({ id: d.id, ...d.data() });
          });
        } catch (hErr) {
          console.error("Error fetching doctors appointments_history:", hErr);
        }

        // 2. Fetch from master consultations collection where doctor_id == user.uid
        try {
          const consultQ = query(
            collection(db, "consultations"),
            where("doctor_id", "==", user.uid)
          );
          const consultSnap = await getDocs(consultQ);
          consultSnap.docs.forEach((d) => {
            const data = d.data();
            const status = (data.status || "").toLowerCase();
            // Skip active upcoming consultations
            if (
              status === "upcoming" ||
              status === "scheduled" ||
              status === "in_progress"
            ) {
              return;
            }
            addOrMerge({ id: d.id, ...data });
          });
        } catch (cErr) {
          console.warn("Error fetching doctor consultations:", cErr);
        }

        items.sort((a, b) => getMillis(b) - getMillis(a));
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
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleString(undefined, {
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <BackButton href="/doctor/consultations" label="Back to Consultations" />
      <h1 className="text-2xl font-semibold text-[#1A1A1A]">History</h1>

      {history.length === 0 ? (
        <p className="text-[#6B6862]">No history yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((appt) => {
            const statusInfo = getConsultationStatusInfo(appt, "doctor");
            const timeVal =
              appt.time ||
              appt.scheduled_at ||
              appt.cancelled_at ||
              appt.created_at;
            return (
              <button
                key={appt.id}
                onClick={() => {
                  const params = new URLSearchParams({
                    userUid: appt.user_id || appt.userId || "",
                    userName: appt.user_name || "",
                    doctorName: appt.doctor_name || "",
                    historyId: appt.history_appointment_id || appt.document_id || "",
                    appointmentId: appt.appointment_id || appt.consultation_id || "",
                  }).toString();

                  router.push(
                    `/doctor/consultations/report/${appt.id}?${params}`
                  );
                }}
                className="w-full bg-white shadow rounded-lg border-l-4 border-[#C8996A] p-4 flex justify-between items-center hover:bg-[#FAF8F5] transition text-left"
              >
                <div>
                  <p className="text-[#1A1A1A] font-semibold text-left">
                    {appt.user_name || "Patient"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-[#6B6862] text-sm">
                      {formatTime(timeVal)}
                    </p>
                    <span
                      className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${statusInfo.badgeClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`}
                      />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-[#8C827A] shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
