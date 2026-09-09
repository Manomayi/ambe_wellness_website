"use client";

import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { httpsCallable } from "firebase/functions";
import {
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  collection
} from "firebase/firestore";
import { db, functions } from "@/lib/firebase/config";
import { fetchEarningsPolicy, formatCents } from "@/lib/doctorEarnings";

export default function CancelConsultationModal({
  appointment,
  doctorUid,
  onClose,
  onSuccess
}) {
  const [policy, setPolicy] = useState(null);
  const [loadingPolicy, setLoadingPolicy] = useState(true);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPolicy() {
      try {
        const fetched = await fetchEarningsPolicy();
        if (isMounted) {
          setPolicy(fetched);
          setLoadingPolicy(false);
        }
      } catch (err) {
        console.error("Error loading earnings policy:", err);
        if (isMounted) setLoadingPolicy(false);
      }
    }
    loadPolicy();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!appointment) return null;

  const apptDate = appointment.time?.toDate
    ? appointment.time.toDate()
    : appointment.time
    ? new Date(appointment.time)
    : null;

  const now = new Date();
  const diffHours = apptDate ? (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;
  const lateWindowHours = policy?.lateCancellationWindowHours ?? 24;
  const isLateCancellation = diffHours < lateWindowHours;
  const finePercent = policy?.lateCancellationFinePercent ?? 50;
  const fineLabel = policy ? formatCents(policy.lateCancellationFineCents) : "$25.00";

  const formatDateTime = (date) => {
    if (!date || isNaN(date.getTime())) return "Unknown Date/Time";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const handleCancelConfirm = async () => {
    if (apptDate && (Date.now() - apptDate.getTime()) > 60 * 60 * 1000) {
      setError("This appointment time has already passed and can no longer be cancelled.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const cancelReason = reason.trim() || (isLateCancellation ? "Doctor cancelled late" : "Doctor unavailable");

    try {
      // 1. Try Cloud Function
      let functionSuccess = false;
      try {
        const cancelFn = httpsCallable(functions, "cancelAppointmentByDoctor");
        await cancelFn({
          appointmentId: appointment.id,
          reason: cancelReason,
        });
        functionSuccess = true;
      } catch (fnErr) {
        console.warn("Cloud function cancelAppointmentByDoctor failed or unauthenticated, trying fallback:", fnErr);
      }

      // 2. Fallback to direct Firestore operations if callable didn't succeed
      if (!functionSuccess) {
        const targetUserId = appointment.user_id || appointment.userId;
        if (!targetUserId) {
          throw new Error("Appointment data is missing user ID.");
        }

        const doctorApptRef = doc(
          db,
          "doctors",
          doctorUid,
          "appointments_upcoming",
          appointment.id
        );
        const userApptRef = doc(
          db,
          "users",
          targetUserId,
          "appointments_upcoming",
          appointment.id
        );
        const userHistoryRef = doc(
          db,
          "users",
          targetUserId,
          "appointments_history",
          appointment.id
        );
        const userNotifRef = doc(
          collection(db, "users", targetUserId, "notifications")
        );
        const userDocRef = doc(db, "users", targetUserId);

        const batch = writeBatch(db);
        batch.delete(doctorApptRef);
        batch.delete(userApptRef);
        batch.set(
          userHistoryRef,
          {
            ...appointment,
            status: "cancelled_by_doctor",
            cancellation_reason: cancelReason,
            note: isLateCancellation
              ? "Doctor cancelled late. Please reschedule."
              : "Doctor requested cancellation. Please reschedule.",
            cancelled_at: serverTimestamp(),
          },
          { merge: true }
        );
        batch.set(userNotifRef, {
          title: "Appointment Cancelled",
          body: `Your doctor has cancelled the consultation scheduled for ${formatDateTime(apptDate)}. Please choose a new slot.`,
          type: "appointment_cancelled",
          is_read: false,
          created_at: serverTimestamp(),
        });
        batch.update(userDocRef, { is_consultation_set: false });
        await batch.commit();
      }

      // Direct sync to master consultations document
      try {
        await setDoc(
          doc(db, "consultations", appointment.id),
          {
            status: "cancelled_by_doctor",
            cancellation_reason: cancelReason,
            is_late_cancellation: isLateCancellation,
            cancelled_by: "doctor",
            doctor_id: doctorUid,
            cancelled_at: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (cErr) {
        console.warn("Error syncing cancel to consultations doc:", cErr);
      }

      if (onSuccess) {
        onSuccess("Consultation cancelled successfully.");
      }
      onClose();
    } catch (err) {
      console.error("Cancellation error:", err);
      setError(err.message || "Failed to cancel appointment. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-[#E7E2D9] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E2D9] bg-[#FAF8F5]">
          <h3 className="text-lg font-bold text-[#1A1A1A]">Cancel Consultation</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-[#8C827A] hover:text-[#1A1A1A] hover:bg-[#E7E2D9]/40 transition disabled:opacity-50 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Appointment Summary Card */}
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
              <UserIcon className="w-4 h-4 text-[#C8996A]" />
              <span className="font-semibold">{appointment.user_name || "Patient"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#6B6862]">
              <CalendarIcon className="w-4 h-4 text-[#C8996A]" />
              <span>{formatDateTime(apptDate)}</span>
            </div>
          </div>

          {/* Late Cancellation Notice or Standard Notice */}
          {loadingPolicy ? (
            <div className="h-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#C8996A]"></div>
            </div>
          ) : isLateCancellation ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3 text-amber-900">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-900 text-sm">Late cancellation fee notice</p>
                <p className="text-amber-800 leading-relaxed">
                  You are cancelling with less than{" "}
                  <strong>{lateWindowHours} hours notice</strong>. You will be charged a{" "}
                  <strong>{finePercent}% fine ({fineLabel})</strong> deducted from your earnings balance.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 leading-relaxed">
              You are cancelling more than {lateWindowHours} hours in advance, so{" "}
              <strong>no late cancellation fee</strong> applies.
            </div>
          )}

          {/* Cancellation Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
              Cancellation Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Doctor unavailable, emergency, etc."
              rows={2}
              disabled={isSubmitting}
              className="w-full text-sm rounded-xl border border-[#E7E2D9] px-3 py-2 text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:ring-2 focus:ring-[#C8996A] transition resize-none disabled:opacity-50"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
              {error}
            </div>
          )}

          <p className="text-xs text-[#6B6862]">
            Are you sure you want to cancel? The patient will be notified immediately to choose another slot.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7E2D9] bg-[#FAF8F5]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold text-[#6B6862] hover:text-[#1A1A1A] transition rounded-xl cursor-pointer disabled:opacity-50"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            onClick={handleCancelConfirm}
            disabled={isSubmitting || loadingPolicy}
            className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
