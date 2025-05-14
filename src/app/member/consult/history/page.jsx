"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'


export default function ConsultationHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      try {
        const histQuery = query(
          collection(db, "patients", user.uid, "appointments_history"),
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold text-gray-800">
        Consultation History
      </h1>
      {history.length === 0 ? (
        <p className="text-gray-600">No appointment history found.</p>
      ) : (
        <div className="space-y-4">
          {history.map((appt) => (
            <div key={appt.id} className="bg-white shadow rounded-lg">
              <Link
                href={
                  `/member/consult/report/${appt.id}` +
                  `?doctorName=${encodeURIComponent(appt.doctor_name)}`
                }
                className="w-full block text-left flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    Dr. {appt.doctor_name}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {formatTime(appt.time)}
                  </p>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
