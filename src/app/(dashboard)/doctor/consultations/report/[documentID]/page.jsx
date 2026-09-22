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
import AmbeBackButton from "@/components/common/AmbeBackButton";
import { getConsultationStatusInfo } from "@/lib/consultationStatus";

export default function DoctorConsultationReportPage() {
  const router = useRouter();
  const { documentID } = useParams();
  const searchParams = useSearchParams();
  const rawUserUid = searchParams.get("userUid") || "";
  const userName = searchParams.get("userName") || "";
  const historyId = searchParams.get("historyId") || "";
  const appointmentId = searchParams.get("appointmentId") || "";

  const [report, setReport] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached =
          sessionStorage.getItem("report_cache_" + documentID) ||
          (historyId ? sessionStorage.getItem("report_cache_" + historyId) : null) ||
          (appointmentId ? sessionStorage.getItem("report_cache_" + appointmentId) : null) ||
          sessionStorage.getItem("last_selected_report");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) return parsed;
        }
      } catch (_) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const cached =
          sessionStorage.getItem("report_cache_" + documentID) ||
          (historyId ? sessionStorage.getItem("report_cache_" + historyId) : null) ||
          (appointmentId ? sessionStorage.getItem("report_cache_" + appointmentId) : null) ||
          sessionStorage.getItem("last_selected_report");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) return false;
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

        const candidateIds = Array.from(
          new Set([historyId, documentID, appointmentId].filter(Boolean))
        );

        // Run primary lookups across doctors appointments_history, root consultations, and users appointments_history IN PARALLEL
        const [docHistResults, consultSnap, userHistResults] = await Promise.all([
          Promise.allSettled(
            candidateIds.map((id) =>
              getDoc(doc(db, "doctors", user.uid, "appointments_history", id))
            )
          ),
          documentID
            ? getDoc(doc(db, "consultations", documentID)).catch(() => null)
            : Promise.resolve(null),
          resolvedUserUid
            ? Promise.allSettled(
                candidateIds.map((id) =>
                  getDoc(doc(db, "users", resolvedUserUid, "appointments_history", id))
                )
              )
            : Promise.resolve([]),
        ]);

        let consultData = null;
        if (consultSnap && consultSnap.exists?.()) {
          consultData = { id: consultSnap.id, ...consultSnap.data() };
          if (!resolvedUserUid) {
            resolvedUserUid = consultData.user_id || consultData.userId || "";
          }
        }

        // 1. Check doctor's appointments_history
        if (Array.isArray(docHistResults)) {
          for (const res of docHistResults) {
            if (res.status === "fulfilled" && res.value?.exists()) {
              const data = res.value.data();
              if (hasClinicalContent(data)) {
                foundReport = { id: res.value.id, ...data };
                break;
              }
              if (!foundReport) {
                foundReport = { id: res.value.id, ...data };
              }
            }
          }
        }

        // 2. Check user's appointments_history for clinical content
        if ((!foundReport || !hasClinicalContent(foundReport)) && Array.isArray(userHistResults)) {
          for (const res of userHistResults) {
            if (res.status === "fulfilled" && res.value?.exists()) {
              const data = res.value.data();
              if (hasClinicalContent(data)) {
                foundReport = { id: res.value.id, ...data };
                try {
                  setDoc(
                    doc(db, "doctors", user.uid, "appointments_history", res.value.id),
                    foundReport,
                    { merge: true }
                  ).catch(() => {});
                } catch (_) {}
                break;
              }
              if (!foundReport) {
                foundReport = { id: res.value.id, ...data };
              }
            }
          }
        }

        // 3. Check consultation collection
        if (consultData) {
          if (!foundReport || (!hasClinicalContent(foundReport) && hasClinicalContent(consultData))) {
            foundReport = consultData;
          }

          // Follow history pointer if clinical content still missing
          const ptr = consultData.history_appointment_id || consultData.document_id;
          if (ptr && (!foundReport || !hasClinicalContent(foundReport)) && !candidateIds.includes(ptr)) {
            try {
              const [ptrDocSnap, ptrUserSnap] = await Promise.all([
                getDoc(doc(db, "doctors", user.uid, "appointments_history", ptr)).catch(() => null),
                resolvedUserUid
                  ? getDoc(doc(db, "users", resolvedUserUid, "appointments_history", ptr)).catch(() => null)
                  : Promise.resolve(null),
              ]);

              if (ptrDocSnap && ptrDocSnap.exists() && hasClinicalContent(ptrDocSnap.data())) {
                foundReport = { id: ptrDocSnap.id, ...ptrDocSnap.data() };
              } else if (ptrUserSnap && ptrUserSnap.exists() && hasClinicalContent(ptrUserSnap.data())) {
                foundReport = { id: ptrUserSnap.id, ...ptrUserSnap.data() };
                try {
                  setDoc(
                    doc(db, "doctors", user.uid, "appointments_history", ptr),
                    foundReport,
                    { merge: true }
                  ).catch(() => {});
                } catch (_) {}
              }
            } catch (_) {}
          }
        }

        // 4. Secondary lookup by query fields if still no clinical report found
        if (!foundReport || !hasClinicalContent(foundReport)) {
          const queryPromises = [];
          const queryFields = [
            "document_id",
            "appointment_id",
            "consultation_id",
            "original_appointment_id",
            "history_appointment_id",
          ];

          if (resolvedUserUid) {
            for (const idToMatch of candidateIds) {
              for (const f of queryFields) {
                queryPromises.push(
                  getDocs(
                    query(
                      collection(db, "users", resolvedUserUid, "appointments_history"),
                      where(f, "==", idToMatch),
                      limit(1)
                    )
                  )
                    .then((qSnap) => (!qSnap.empty ? { id: qSnap.docs[0].id, ...qSnap.docs[0].data(), fromUser: true } : null))
                    .catch(() => null)
                );
              }
            }
          }

          for (const idToMatch of candidateIds) {
            for (const f of queryFields) {
              queryPromises.push(
                getDocs(
                  query(
                    collection(db, "doctors", user.uid, "appointments_history"),
                    where(f, "==", idToMatch),
                    limit(1)
                  )
                )
                  .then((qSnap) => (!qSnap.empty ? { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } : null))
                  .catch(() => null)
              );
            }
          }

          if (queryPromises.length > 0) {
            const queryResults = await Promise.all(queryPromises);
            for (const item of queryResults) {
              if (item && hasClinicalContent(item)) {
                foundReport = item;
                if (item.fromUser) {
                  try {
                    setDoc(
                      doc(db, "doctors", user.uid, "appointments_history", item.id),
                      item,
                      { merge: true }
                    ).catch(() => {});
                  } catch (_) {}
                }
                break;
              }
            }
            if (!foundReport) {
              const anyFound = queryResults.find(Boolean);
              if (anyFound) foundReport = anyFound;
            }
          }
        }

        // 5. Fallback: appointments_reports_to_finish
        if (!foundReport) {
          const finishResults = await Promise.all(
            candidateIds.map((id) =>
              getDoc(doc(db, "doctors", user.uid, "appointments_reports_to_finish", id))
                .then((snap) => (snap.exists() ? { id: snap.id, ...snap.data() } : null))
                .catch(() => null)
            )
          );
          const finishDoc = finishResults.find(Boolean);
          if (finishDoc) foundReport = finishDoc;
        }

        // 6. Final fallback: consultData
        if (!foundReport && consultData) {
          foundReport = consultData;
        }

        if (foundReport) {
          setReport(foundReport);
          try {
            sessionStorage.setItem("report_cache_" + documentID, JSON.stringify(foundReport));
          } catch (_) {}
        }
      } catch (e) {
        console.error("Error loading report:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [rawUserUid, historyId, appointmentId, documentID, router]);

  const formatReportDate = (ts) => {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null;
    if (!d || isNaN(d.getTime())) return "";
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const day = d.getDate();
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${month} ${day}, ${timeStr}`;
  };

  const formatCategoryTitle = (key) => {
    const k = key.toLowerCase();
    if (k === "lifestyle") return "Lifestyle";
    if (k === "yoga_meditation" || k === "meditation" || k === "yogameditation") return "Yoga & Meditation";
    if (k === "exercise") return "Exercise";
    if (k === "diet") return "Diet";
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="animate-spin h-10 w-10 rounded-full 
                        border-2 border-[#FFD3AC] 
                        border-t-transparent"
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen text-white pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute left-0">
            <AmbeBackButton
              onClick={() => router.push("/doctor/consultations/history")}
            />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white text-center">
            Report
          </h1>
        </div>
        <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-10 text-center">
          <p className="text-gray-400">No consultation report found.</p>
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

  const rawDoctorName =
    searchParams.get("doctorName") ||
    report?.doctor_name ||
    report?.doctorName ||
    "";
  const cleanDoctorName = rawDoctorName
    ? rawDoctorName.replace(/^dr\.?\s*/i, "").trim()
    : "";
  const displayDoctorName = cleanDoctorName ? `Dr. ${cleanDoctorName}` : "";

  const patientFirstName = userName
    ? userName.trim().split(" ")[0]
    : (report?.user_name || report?.userName || "Patient").trim().split(" ")[0];
  const pageTitle = `${patientFirstName}'s Report`;

  const IGNORED_METADATA_KEYS = new Set([
    "useruid",
    "userid",
    "user_uid",
    "user_id",
    "uid",
    "appointmentid",
    "appointment_id",
    "doctoruid",
    "doctor_uid",
    "doctorid",
    "doctor_id",
    "historyid",
    "history_id",
    "documentid",
    "document_id",
    "createdat",
    "created_at",
    "updatedat",
    "updated_at",
    "timestamp",
    "referral",
  ]);

  const rawRecommendations = recommendations && typeof recommendations === "object" ? recommendations : {};
  const validRecommendations = Object.entries(rawRecommendations).filter(([cat, rec]) => {
    if (!rec) return false;
    const normalizedKey = cat.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (IGNORED_METADATA_KEYS.has(normalizedKey)) return false;
    const itemNotes = typeof rec === "object" ? (rec.notes || rec.note || "") : String(rec);
    const selectedOption = typeof rec === "object" ? (rec.selectedOption || rec.selected_option || rec.option || "") : "";
    return Boolean(String(itemNotes).trim() || String(selectedOption).trim());
  });

  const CATEGORY_PRIORITY = {
    lifestyle: 1,
    yoga_meditation: 2,
    meditation: 2,
    yogameditation: 2,
    exercise: 3,
    diet: 4,
  };

  const orderedRecommendations = [...validRecommendations].sort(([a], [b]) => {
    const normA = a.toLowerCase().replace(/[^a-z0-9]/g, "");
    const normB = b.toLowerCase().replace(/[^a-z0-9]/g, "");
    const pA = CATEGORY_PRIORITY[normA] || 99;
    const pB = CATEGORY_PRIORITY[normB] || 99;
    return pA - pB;
  });

  const isDuplicateNote = Boolean(
    notes &&
    orderedRecommendations.some(([_, rec]) => {
      const rNotes = typeof rec === "object" ? (rec.notes || rec.note || "") : String(rec);
      return rNotes && rNotes.trim() === String(notes).trim();
    })
  );

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      {/* Top Bar with Centered Title matching Flutter AppBar */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute left-0">
          <AmbeBackButton
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push('/doctor/consultations/history');
              }
            }}
          />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white text-center">
          {pageTitle}
        </h1>
      </div>

      {/* Cancellation Banner */}
      {statusInfo.isCancelled && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-5 shadow-md space-y-2 backdrop-blur-md">
          <p className="text-xs uppercase font-semibold text-red-300 tracking-wider">
            CONSULTATION STATUS
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
            <p className="text-xs text-red-200/80">
              Cancelled on: {formatReportDate(cancelDate)}
            </p>
          )}
          {reason && (
            <p className="text-xs text-red-200/70 italic">
              Reason: {reason}
            </p>
          )}
        </div>
      )}

      {/* Doctor Section matching App */}
      {displayDoctorName && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm uppercase font-semibold text-white/50 tracking-wider">
            DOCTOR
          </p>
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-[#FFD3AC]/15 border border-[#FFD3AC]/25 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v1.069m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">
              {displayDoctorName}
            </span>
          </div>
        </div>
      )}

      {/* Date Section matching App */}
      {effectiveTime && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm uppercase font-semibold text-white/50 tracking-wider">
            DATE
          </p>
          <div className="bg-gradient-to-br from-[#FFD3AC] to-[#F5C59F] rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 text-[#1E1E1E]">
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#1E1E1E]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="text-base font-bold text-[#1E1E1E]">
              {formatReportDate(effectiveTime)}
            </span>
          </div>
        </div>
      )}

      {/* Recommendations Section matching App */}
      {orderedRecommendations.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm uppercase font-semibold text-white/50 tracking-wider">
            RECOMMENDATIONS
          </p>
          <div className="space-y-3">
            {orderedRecommendations.map(([cat, rec]) => {
              const selectedOption =
                typeof rec === "object"
                  ? rec.selectedOption || rec.selected_option || rec.option || ""
                  : "";
              const categoryNotes =
                typeof rec === "object" ? rec.notes || rec.note || "" : String(rec);

              return (
                <div
                  key={cat}
                  className="bg-white/[0.08] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 backdrop-blur-md"
                >
                  <h3 className="font-sans font-semibold text-[17px] text-white">
                    {formatCategoryTitle(cat)}
                  </h3>

                  {categoryNotes && String(categoryNotes).trim().length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[13px] font-semibold text-[#FFD3AC]">
                        Notes:
                      </span>
                      <div className="w-full bg-black/25 border border-white/[0.08] rounded-xl p-3.5 sm:p-4 text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                        {categoryNotes}
                      </div>
                    </div>
                  )}

                  {selectedOption && String(selectedOption).trim().length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[13px] font-semibold text-[#FFD3AC]">
                        Selected Option:
                      </span>
                      <div className="w-full bg-black/25 border border-white/[0.08] rounded-xl p-3.5 sm:p-4 text-sm font-medium text-white/85 leading-relaxed">
                        {selectedOption}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty Clinical Content Message */}
      {orderedRecommendations.length === 0 &&
        (!store_recommendations || store_recommendations.length === 0) &&
        (!notes || String(notes).trim().length === 0) &&
        !report.referral &&
        !statusInfo.isCancelled && (
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-white/70 text-sm">
              Consultation completed. Clinical report is being processed.
            </p>
          </div>
        )}

      {/* Recommended Products matching App */}
      {Array.isArray(store_recommendations) &&
        store_recommendations.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm uppercase font-semibold text-white/50 tracking-wider">
              PRODUCTS
            </p>
            <div className="space-y-3">
              {store_recommendations.map((item, i) => (
                <div
                  key={i}
                  className="bg-white/[0.08] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-md"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#FFD3AC]/15 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-sans font-semibold text-white text-[17px]">
                        {item.product_name || item.productName || "Product"}
                      </h4>
                      {item.size && (
                        <p className="text-xs text-white/60 mt-0.5">
                          Size: {item.size}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-[#FFD3AC]/15 text-[#FFD3AC] rounded-full text-sm font-semibold">
                    Qty: {item.quantity || item.qty || 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Notes Section (matching App) */}
      {!isDuplicateNote && notes && String(notes).trim().length > 0 && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm uppercase font-semibold text-white/50 tracking-wider">
            NOTES
          </p>
          <div className="bg-white/[0.08] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[#FFD3AC]">
              <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-sm font-semibold text-[#FFD3AC]">Doctor's Notes</span>
            </div>
            <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
              {notes}
            </div>
          </div>
        </div>
      )}

      {/* Referral */}
      {report.referral && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm uppercase font-semibold text-white/50 tracking-wider">
            REFERRAL
          </p>
          <div className="bg-white/[0.08] border border-[#FFD3AC]/40 rounded-2xl p-4 sm:p-5 flex items-center gap-4 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/15 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v1.069m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Doctor Recommendation
              </p>
              <p className="text-sm sm:text-[15px] font-semibold text-white mt-1">
                For requesting new doctor you can refer to {report.referral.referred_to_doctor_name || report.referral.doctor_name || report.referral.referred_specialty_label || report.referral.specialty || "Specialist"}
              </p>
              {report.referral.notes && (
                <p className="text-xs text-white/70 mt-1">{report.referral.notes}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
