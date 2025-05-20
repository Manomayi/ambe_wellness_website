// src/app/member/consult/report/[documentID]/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function ConsultationReportPage() {
  const router = useRouter();
  const { documentID } = useParams();
  const searchParams = useSearchParams();
  const patientUid = searchParams.get("patientUid");
  const patientName = searchParams.get("patientName");
  const doctorName = searchParams.get("doctorName");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!patientUid || !documentID) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(
          doc(db, "patients", patientUid, "profile", documentID)
        );
        if (snap.exists()) setReport(snap.data());
      } catch (e) {
        console.error("Error loading report:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [patientUid, documentID, router]);

  const formatTime = (ts) => {
    const d = ts?.toDate?.();
    return d
      ? d.toLocaleString(undefined, {
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })
      : "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin h-12 w-12 rounded-full 
                        border-4 border-t-4 border-green-600 
                        border-t-transparent"
        />
      </div>
    );
  }
  if (!report) {
    return <p className="text-center text-gray-600">No data found.</p>;
  }

  const { recommendations, store_recommendations, notes, time } = report;

  return (
    <div className="space-y-8 p-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
       
        <h1 className="text-xl font-semibold text-gray-800">
          {patientName?.split(" ")[0]}'s Report
        </h1>
      </div>

      {/* Doctor */}
      {doctorName && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-2">
            Doctor
          </p>
          <div className="bg-white text-gray-800 p-4 rounded-lg shadow">
            Dr. {doctorName}
          </div>
        </>
      )}

      {/* Date */}
      {time && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-2">
            Date
          </p>
          <div className="bg-white text-gray-800 p-4 rounded-lg shadow">
            {formatTime(time)}
          </div>
        </>
      )}

      {/* Recommendations */}
      {recommendations && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-4">
            Recommendations
          </p>
          {["lifestyle", "meditation", "exercise", "diet"].map((cat) => {
            const rec = recommendations[cat];
            if (!rec) return null;
            const Title = cat.charAt(0).toUpperCase() + cat.slice(1);
            return (
              <div
                key={cat}
                className="bg-white text-white p-4 rounded-lg shadow mb-4"
              >
                <h3 className="font-bold text-gray-900">{Title}</h3>
                {rec.selectedOption && (
                  <p className="mt-2 text-gray-900">
                    <strong>Selected:</strong> {rec.selectedOption}
                  </p>
                )}
                {rec.notes && (
                  <p className="mt-2 text-gray-900">
                    <strong>Notes:</strong> {rec.notes}
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}
      {/* Products */}
      {Array.isArray(store_recommendations) &&
        store_recommendations.length > 0 && (
          <>
            <p className="text-sm uppercase font-semibold text-gray-600 mb-2">
              Products
            </p>
            {store_recommendations.map((item, i) => (
              <div
                key={i}
                className="bg-white text-white p-4 rounded-lg shadow mb-4 flex justify-between"
              >
                <div>
                  <h3 className="font-bold text-gray-900">
                    {item.productName}
                  </h3>
                  {item.size && (
                    <p className="text-gray-900">Size: {item.size}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Qty</p>
                  <p className="text-gray-900">{item.quantity}</p>
                </div>
              </div>
            ))}
          </>
        )}

      {/* Notes */}
      {notes && (
        <>
          <p className="text-sm uppercase font-semibold text-gray-600 mb-2">
            Notes
          </p>
          <div className="bg-white text-gray-800 p-4 rounded-lg shadow">
            {notes}
          </div>
        </>
      )}
    </div>
  );
}
