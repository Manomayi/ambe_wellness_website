// src/app/doctor/consultations/history/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs, where, doc, setDoc } from "firebase/firestore";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import AmbeBackButton from '@/components/common/AmbeBackButton';
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
                newItem.recommendations || existing.recommendations,
              dietPlan: newItem.dietPlan || existing.dietPlan,
              lifestyleNotes:
                newItem.lifestyleNotes || existing.lifestyleNotes,
              cleansePlan: newItem.cleansePlan || existing.cleansePlan,
              dosha_dominant:
                newItem.dosha_dominant || existing.dosha_dominant,
              status: isCancelled ? "cancelled" : (newItem.status || existing.status),
            };
          } else {
            items.push(newItem);
          }
        };

        // 1. Fetch from root consultations collection
        try {
          const rootRef = collection(db, "consultations");
          const qRoot = query(
            rootRef,
            where("doctor_id", "==", user.uid),
            orderBy("time", "desc")
          );
          const rootSnap = await getDocs(qRoot);
          rootSnap.forEach((docSnap) => {
            const data = docSnap.data();
            addOrMerge({
              id: docSnap.id,
              document_id: docSnap.id,
              ...data,
            });
          });
        } catch (err) {
          console.warn("Could not query root consultations:", err);
        }

        // 2. Fetch from doctor's appointments_history
        try {
          const docHistRef = collection(
            db,
            "doctors",
            user.uid,
            "appointments_history"
          );
          const qHist = query(docHistRef, orderBy("time", "desc"));
          const histSnap = await getDocs(qHist);
          histSnap.forEach((docSnap) => {
            const data = docSnap.data();
            addOrMerge({
              id: docSnap.id,
              document_id: docSnap.id,
              history_appointment_id: docSnap.id,
              ...data,
            });
          });
        } catch (err) {
          console.warn("Could not query doctor appointments_history:", err);
        }

        // Sort desc
        items.sort((a, b) => getMillis(b) - getMillis(a));
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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <AmbeBackButton href="/doctor/consultations" />
        <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">
          Consultation History
        </h1>
      </div>

      {history.length === 0 ? (
        <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-10 text-center">
          <p className="text-gray-400 font-sans">No consultation history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="w-full bg-[#1B1A18]/80 border border-white/10 hover:border-[#FFD3AC]/40 rounded-2xl p-4 sm:p-5 flex justify-between items-center transition text-left cursor-pointer group"
              >
                <div>
                  <p className="text-white font-semibold font-sans text-base">
                    {appt.user_name || "Patient"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="text-gray-400 text-xs font-sans">
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
                <ChevronRightIcon className="h-5 w-5 text-[#FFD3AC] shrink-0 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
