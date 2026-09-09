// src/app/doctor/consultations/report/[documentID]/page.jsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  setDoc,
} from "firebase/firestore";
import BackButton from "@/components/common/BackButton";
import { getConsultationStatusInfo } from "@/lib/consultationStatus";

export default function DoctorConsultationReportPage() {
  const router = useRouter();
  const { documentID } = useParams();
  const searchParams = useSearchParams();
  const rawUserUid = searchParams.get("userUid") || "";
  const userName = searchParams.get("userName") || "";
  const historyId = searchParams.get("historyId") || "";
  const appointmentId = searchParams.get("appointmentId") || "";

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
        let resolvedUserUid = rawUserUid;

        const hasClinicalContent = (data) => {
          if (!data) return false;
          return (
            Boolean(data.recommendations && Object.keys(data.recommendations).length > 0) ||
            Boolean(data.notes && String(data.notes).trim().length > 0) ||
            Boolean(Array.isArray(data.store_recommendations) && data.store_recommendations.length > 0)
          );
        };

        const candidateIds = [
          historyId,
          documentID,
          appointmentId,
        ].filter(Boolean);

        // 1. Check doctor's appointments_history for candidate IDs
        for (const id of candidateIds) {
          try {
            const snapHist = await getDoc(
              doc(db, "doctors", user.uid, "appointments_history", id)
            );
            if (snapHist.exists() && hasClinicalContent(snapHist.data())) {
              foundReport = { id: snapHist.id, ...snapHist.data() };
              break;
            }
          } catch (_) {}
        }

        // 2. Check user's appointments_history for candidate IDs
        if (!foundReport && resolvedUserUid) {
          for (const id of candidateIds) {
            try {
              const snapUser = await getDoc(
                doc(db, "users", resolvedUserUid, "appointments_history", id)
              );
              if (snapUser.exists() && hasClinicalContent(snapUser.data())) {
                foundReport = { id: snapUser.id, ...snapUser.data() };
                // Self-heal into doctor's appointments_history
                try {
                  await setDoc(
                    doc(db, "doctors", user.uid, "appointments_history", snapUser.id),
                    foundReport,
                    { merge: true }
                  );
                } catch (_) {}
                break;
              }
            } catch (_) {}
          }
        }

        // 3. Check root consultations collection
        let consultData = null;
        try {
          const snapConsult = await getDoc(doc(db, "consultations", documentID));
          if (snapConsult.exists()) {
            consultData = { id: snapConsult.id, ...snapConsult.data() };
            if (!resolvedUserUid) {
              resolvedUserUid = consultData.user_id || consultData.userId || "";
            }

            if (!foundReport && hasClinicalContent(consultData)) {
              foundReport = consultData;
            }

            // Follow history_appointment_id pointer if available
            const ptr =
              consultData.history_appointment_id || consultData.document_id;
            if (!foundReport && ptr) {
              // Try doctor's history with pointer
              try {
                const snapPtr = await getDoc(
                  doc(db, "doctors", user.uid, "appointments_history", ptr)
                );
                if (snapPtr.exists() && hasClinicalContent(snapPtr.data())) {
                  foundReport = { id: snapPtr.id, ...snapPtr.data() };
                }
              } catch (_) {}

              // Try user's history with pointer
              if (!foundReport && resolvedUserUid) {
                try {
                  const snapUserPtr = await getDoc(
                    doc(db, "users", resolvedUserUid, "appointments_history", ptr)
                  );
                  if (snapUserPtr.exists() && hasClinicalContent(snapUserPtr.data())) {
                    foundReport = { id: snapUserPtr.id, ...snapUserPtr.data() };
                    try {
                      await setDoc(
                        doc(db, "doctors", user.uid, "appointments_history", ptr),
                        foundReport,
                        { merge: true }
                      );
                    } catch (_) {}
                  }
                } catch (_) {}
              }
            }
          }
        } catch (_) {}

        // 4. Query user's appointments_history by fields (same robust strategy as user side)
        if (!foundReport && resolvedUserUid) {
          const queryFields = [
            "document_id",
            "appointment_id",
            "consultation_id",
            "original_appointment_id",
            "history_appointment_id",
          ];
          for (const idToMatch of candidateIds) {
            if (foundReport) break;
            for (const f of queryFields) {
              try {
                const qSnap = await getDocs(
                  query(
                    collection(db, "users", resolvedUserUid, "appointments_history"),
                    where(f, "==", idToMatch),
                    limit(1)
                  )
                );
                if (!qSnap.empty) {
                  const matchedDoc = qSnap.docs[0];
                  foundReport = { id: matchedDoc.id, ...matchedDoc.data() };
                  try {
                    await setDoc(
                      doc(db, "doctors", user.uid, "appointments_history", matchedDoc.id),
                      foundReport,
                      { merge: true }
                    );
                  } catch (_) {}
                  break;
                }
              } catch (_) {}
            }
          }
        }

        // 5. Query doctor's appointments_history by fields
        if (!foundReport) {
          const queryFields = [
            "document_id",
            "appointment_id",
            "consultation_id",
            "history_appointment_id",
          ];
          for (const idToMatch of candidateIds) {
            if (foundReport) break;
            for (const f of queryFields) {
              try {
                const qSnap = await getDocs(
                  query(
                    collection(db, "doctors", user.uid, "appointments_history"),
                    where(f, "==", idToMatch),
                    limit(1)
                  )
                );
                if (!qSnap.empty) {
                  const matchedDoc = qSnap.docs[0];
                  foundReport = { id: matchedDoc.id, ...matchedDoc.data() };
                  break;
                }
              } catch (_) {}
            }
          }
        }

        // 6. Check appointments_reports_to_finish fallback
        if (!foundReport) {
          for (const id of candidateIds) {
            try {
              const snapFinish = await getDoc(
                doc(db, "doctors", user.uid, "appointments_reports_to_finish", id)
              );
              if (snapFinish.exists()) {
                foundReport = { id: snapFinish.id, ...snapFinish.data() };
                break;
              }
            } catch (_) {}
          }
        }

        // 7. If still no clinical report found, fall back to consultation or history stub for status display
        if (!foundReport && consultData) {
          foundReport = consultData;
        }

        if (!foundReport) {
          for (const id of candidateIds) {
            try {
              const snapDirect = await getDoc(
                doc(db, "doctors", user.uid, "appointments_history", id)
              );
              if (snapDirect.exists()) {
                foundReport = { id: snapDirect.id, ...snapDirect.data() };
                break;
              }
            } catch (_) {}
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
  }, [rawUserUid, historyId, appointmentId, documentID, router]);

  const formatTime = (ts) => {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
    return d
      ? d.toLocaleString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
        })
      : "";
  };

  const formatCategoryTitle = (key) => {
    if (key === "yoga_meditation") return "Yoga & Meditation";
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <BackButton href="/doctor/consultations/history" label="Back to History" />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-10 text-center shadow-sm">
          <p className="text-[#6B6862]">No consultation report found.</p>
        </div>
      </div>
    );
  }

  const { recommendations, store_recommendations, notes, time } = report;
  const statusInfo = getConsultationStatusInfo(report, "doctor");
  const cancelDate = report.cancelled_at || report.cancelledAt;
  const reason =
    report.cancellation_reason || report.cancellationReason || report.note;
  const effectiveTime =
    time || report.scheduled_at || report.cancelled_at || report.created_at;

  const hasRecommendations =
    recommendations &&
    typeof recommendations === "object" &&
    Object.keys(recommendations).length > 0;

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <BackButton href="/doctor/consultations/history" label="Back to History" />
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          {userName ? `${userName.split(" ")[0]}'s Consultation Report` : "Consultation Report"}
        </h1>
        <p className="text-sm text-[#6B6862] mt-1">
          Review clinical observations and personalized wellness protocols.
        </p>
      </div>

      {/* Cancellation Banner */}
      {statusInfo.isCancelled && (
        <div className="bg-white border border-red-200 rounded-xl p-5 shadow-sm space-y-2">
          <p className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
            Consultation Status
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${statusInfo.badgeClass}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`}
              />
              {statusInfo.label}
            </span>
          </div>
          {cancelDate && (
            <p className="text-sm text-gray-700">
              Cancelled on: {formatTime(cancelDate)}
            </p>
          )}
          {reason && (
            <p className="text-sm text-gray-600 italic">
              Reason: {reason}
            </p>
          )}
        </div>
      )}

      {/* Date */}
      {effectiveTime && (
        <div className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-semibold text-[#8C827A] tracking-wider">
              Consultation Date & Time
            </p>
            <p className="text-base font-semibold text-[#1A1A1A] mt-1">
              {formatTime(effectiveTime)}
            </p>
          </div>
          <span
            className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium ${statusInfo.badgeClass}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotClass}`}
            />
            {statusInfo.label}
          </span>
        </div>
      )}

      {/* Doctor Summary / Notes */}
      {notes && (
        <div className="space-y-2">
          <p className="text-xs uppercase font-bold text-[#8C827A] tracking-wider">
            Clinical Notes & Observations
          </p>
          <div className="bg-white border border-[#E7E2D9] border-l-4 border-l-[#C8996A] rounded-xl p-5 shadow-sm">
            <p className="text-sm text-[#2A2A2A] leading-relaxed whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {hasRecommendations && (
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-[#8C827A] tracking-wider">
            Protocol & Recommendations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(recommendations).map(([cat, rec]) => {
              if (!rec) return null;
              const selectedOption =
                typeof rec === "object"
                  ? rec.selectedOption || rec.selected_option || ""
                  : "";
              const categoryNotes =
                typeof rec === "object" ? rec.notes || "" : String(rec);

              if (!selectedOption && !categoryNotes) return null;

              return (
                <div
                  key={cat}
                  className="bg-white border border-[#E7E2D9] rounded-xl p-5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[#1A1A1A]">
                      {formatCategoryTitle(cat)}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-[#C8996A]" />
                  </div>
                  {selectedOption && (
                    <p className="text-xs font-semibold text-[#C8996A]">
                      {selectedOption}
                    </p>
                  )}
                  {categoryNotes && (
                    <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                      {categoryNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Products */}
      {Array.isArray(store_recommendations) &&
        store_recommendations.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold text-[#8C827A] tracking-wider">
              Recommended Products
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {store_recommendations.map((item, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] text-sm">
                      {item.product_name || item.productName || "Product"}
                    </h4>
                    {item.size && (
                      <p className="text-xs text-[#8C827A] mt-0.5">
                        Size: {item.size}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8C827A]">Qty</p>
                    <p className="font-semibold text-[#1A1A1A] text-sm">
                      {item.quantity || item.qty || 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Referral */}
      {report.referral && (
        <div className="space-y-2">
          <p className="text-xs uppercase font-bold text-[#8C827A] tracking-wider">
            Referral
          </p>
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-4 shadow-sm">
            <p className="text-sm text-[#1A1A1A]">
              <strong>Specialty / Doctor:</strong>{" "}
              {report.referral.doctor_name || report.referral.specialty || "Referral requested"}
            </p>
            {report.referral.notes && (
              <p className="text-xs text-[#6B6862] mt-1">
                {report.referral.notes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
