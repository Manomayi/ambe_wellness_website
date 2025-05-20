// src/app/expert/consultations/history/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export default function ExpertConsultationHistoryPage() {
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
        const histQuery = query(
          collection(db, "doctors", user.uid, "appointments_history"),
          orderBy("time", "desc")
        );
        const snap = await getDocs(histQuery);
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
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
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold text-gray-800">History</h1>

      {history.length === 0 ? (
        <p className="text-gray-600">No history yet.</p>
      ) : (
        <div className="space-y-4">
          {history.map((appt) => (
            <button
              key={appt.id}
              onClick={() => {
                // use appt.id and its fields
                const params = new URLSearchParams({
                  patientUid: appt.patient_id,
                  patientName: appt.patient_name,
                  doctorName: appt.doctor_name,
                }).toString();

                router.push(
                  `/expert/consultations/report/${appt.id}?${params}`
                );
              }}
              className="w-full bg-white shadow rounded-lg border-l-4 border-green-600 p-4 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div>
                <p className="text-gray-800 font-semibold text-left">
                  {appt.patient_name}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {formatTime(appt.time)}
                </p>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
