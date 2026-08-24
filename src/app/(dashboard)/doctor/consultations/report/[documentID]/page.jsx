// src/app/user/consult/report/[documentID]/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import BackButton from "@/components/common/BackButton";

export default function ConsultationReportPage() {
  const router = useRouter();
  const { documentID } = useParams();
  const searchParams = useSearchParams();
  const userUid = searchParams.get("userUid");
  const userName = searchParams.get("userName");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!documentID) {
        setLoading(false);
        return;
      }
      try {
        let foundReport = null;

        if (userUid) {
          const snap = await getDoc(
            doc(db, "users", userUid, "profile", documentID)
          );
          if (snap.exists()) {
            foundReport = snap.data();
          }
        }

        if (!foundReport) {
          const snapFinish = await getDoc(
            doc(db, "doctors", user.uid, "appointments_reports_to_finish", documentID)
          );
          if (snapFinish.exists()) {
            foundReport = snapFinish.data();
          }
        }

        if (!foundReport) {
          const snapHist = await getDoc(
            doc(db, "doctors", user.uid, "appointments_history", documentID)
          );
          if (snapHist.exists()) {
            foundReport = snapHist.data();
          }
        }

        setReport(foundReport);
      } catch (e) {
        console.error("Error loading report:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [userUid, documentID, router]);

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
                        border-4 border-t-4 border-[#C8996A] 
                        border-t-transparent"
        />
      </div>
    );
  }
  if (!report) {
    return <p className="text-center text-[#6B6862]">No data found.</p>;
  }

  const { recommendations, store_recommendations, notes, time } = report;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <BackButton href="/doctor/consultations/history" label="Back to History" />
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-[#1A1A1A]">
          {userName?.split(" ")[0]}'s Report
        </h1>
      </div>

      {/* Date */}
      {time && (
        <>
          <p className="text-sm uppercase font-semibold text-[#6B6862] mb-2">
            Date
          </p>
          <div className="bg-white text-[#1A1A1A] p-4 rounded-lg shadow">
            {formatTime(time)}
          </div>
        </>
      )}

      {/* Recommendations */}
      {recommendations && (
        <>
          <p className="text-sm uppercase font-semibold text-[#6B6862] mb-4">
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
                <h3 className="font-bold text-[#1A1A1A]">{Title}</h3>
                {rec.selectedOption && (
                  <p className="mt-2 text-[#1A1A1A]">
                    <strong>Selected:</strong> {rec.selectedOption}
                  </p>
                )}
                {rec.notes && (
                  <p className="mt-2 text-[#1A1A1A]">
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
            <p className="text-sm uppercase font-semibold text-[#6B6862] mb-2">
              Products
            </p>
            {store_recommendations.map((item, i) => (
              <div
                key={i}
                className="bg-white text-white p-4 rounded-lg shadow mb-4 flex justify-between"
              >
                <div>
                  <h3 className="font-bold text-[#1A1A1A]">
                    {item.product_name}
                  </h3>
                  {item.size && (
                    <p className="text-[#1A1A1A]">Size: {item.size}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1A1A1A]">Qty</p>
                  <p className="text-[#1A1A1A]">{item.quantity}</p>
                </div>
              </div>
            ))}
          </>
        )}

      {/* Notes */}
      {notes && (
        <>
          <p className="text-sm uppercase font-semibold text-[#6B6862] mb-2">
            Notes
          </p>
          <div className="bg-white text-[#1A1A1A] p-4 rounded-lg shadow">
            {notes}
          </div>
        </>
      )}
    </div>
  );
}
