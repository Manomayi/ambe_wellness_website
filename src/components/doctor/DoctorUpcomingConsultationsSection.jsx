"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  VideoCameraIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import CancelConsultationModal from "@/components/doctor/CancelConsultationModal";
import RescheduleConsultationModal from "@/components/doctor/RescheduleConsultationModal";

export default function DoctorUpcomingConsultationsSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [currentAppointments, setCurrentAppointments] = useState([]);
  const [rawAppointments, setRawAppointments] = useState([]);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const resolvingSetRef = useRef(new Set());

  const autoResolveExpiredConsultation = async (apt, docId) => {
    if (!user) return;
    const appointmentId = (apt.appointment_id || docId || "").toString();
    if (!appointmentId || resolvingSetRef.current.has(appointmentId)) return;
    resolvingSetRef.current.add(appointmentId);

    const userUid = apt.user_id || apt.user_uid || apt.userId;
    const doctorUid = user.uid;

    const userJoined = apt.user_joined === true;
    const doctorJoined = apt.doctor_joined === true;

    let resolvedStatus = "no_show";
    let isNoShow = true;
    if (
      apt.status === "completed" ||
      apt.consultation_outcome === "completed" ||
      (userJoined && doctorJoined)
    ) {
      resolvedStatus = "completed";
      isNoShow = false;
    } else if (userJoined && !doctorJoined) {
      resolvedStatus = "doctor_absent";
      isNoShow = false;
    } else {
      resolvedStatus = "no_show";
      isNoShow = true;
    }

    try {
      const batch = writeBatch(db);
      const historyData = {
        ...apt,
        status: resolvedStatus,
        is_no_show: isNoShow,
        auto_resolved: true,
        resolved_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docUpcomingRef = doc(
        db,
        "doctors",
        doctorUid,
        "appointments_upcoming",
        appointmentId
      );
      batch.delete(docUpcomingRef);

      if (resolvedStatus === "completed") {
        const docReportsRef = doc(
          db,
          "doctors",
          doctorUid,
          "appointments_reports_to_finish",
          appointmentId
        );
        batch.set(docReportsRef, historyData, { merge: true });
        const doctorDocRef = doc(db, "doctors", doctorUid);
        batch.set(
          doctorDocRef,
          {
            pending: { finish_report: increment(1) },
          },
          { merge: true }
        );
      } else {
        const docHistoryRef = doc(
          db,
          "doctors",
          doctorUid,
          "appointments_history",
          appointmentId
        );
        batch.set(docHistoryRef, historyData, { merge: true });
      }

      if (userUid) {
        const userUpcomingRef = doc(
          db,
          "users",
          userUid,
          "appointments_upcoming",
          appointmentId
        );
        const userHistoryRef = doc(
          db,
          "users",
          userUid,
          "appointments_history",
          appointmentId
        );
        batch.delete(userUpcomingRef);
        batch.set(userHistoryRef, historyData, { merge: true });
        batch.update(doc(db, "users", userUid), { is_consultation_set: false });
      }

      const consultRef = doc(db, "consultations", appointmentId);
      batch.set(
        consultRef,
        {
          status: resolvedStatus,
          is_no_show: isNoShow,
          auto_resolved: true,
          resolved_at: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      console.log(
        `Doctor auto-resolved expired consultation ${appointmentId} to ${resolvedStatus}`
      );
    } catch (e) {
      console.warn("Doctor error auto-resolving expired consultation:", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    const upcomingCol = collection(
      db,
      "doctors",
      user.uid,
      "appointments_upcoming"
    );

    const unsubscribe = onSnapshot(
      upcomingCol,
      (snapshot) => {
        const appointments = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        appointments.sort((a, b) => {
          const timeA = a.time?.toDate
            ? a.time.toDate().getTime()
            : a.time
            ? new Date(a.time).getTime()
            : 0;
          const timeB = b.time?.toDate
            ? b.time.toDate().getTime()
            : b.time
            ? new Date(b.time).getTime()
            : 0;
          return timeA - timeB;
        });

        setRawAppointments(appointments);
        setLoading(false);
      },
      (error) => {
        if (error?.code === "permission-denied") return;
        console.error("Error listening to upcoming appointments:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!rawAppointments || rawAppointments.length === 0) {
      setCurrentAppointments([]);
      setPendingAppointments([]);
      setUpcomingAppointments([]);
      return;
    }

    const nowDate = new Date();
    const current = [];
    const pending = [];
    const upcoming = [];

    rawAppointments.forEach((apt) => {
      if (
        apt.call_status === "ended" ||
        apt.status === "completed" ||
        apt.status === "finished"
      ) {
        autoResolveExpiredConsultation(apt, apt.id);
        return;
      }

      const aptDate = apt.time?.toDate
        ? apt.time.toDate()
        : apt.time
        ? new Date(apt.time)
        : null;
      if (!aptDate) {
        upcoming.push(apt);
        return;
      }
      const diffMinutes = (aptDate.getTime() - nowDate.getTime()) / (1000 * 60);

      if (diffMinutes >= -60 && diffMinutes <= 15) {
        current.push(apt);
      } else if (diffMinutes < -60) {
        autoResolveExpiredConsultation(apt, apt.id);
      } else {
        upcoming.push(apt);
      }
    });

    setCurrentAppointments(current);
    setPendingAppointments(pending);
    setUpcomingAppointments(upcoming);
  }, [rawAppointments, tick]);

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const isExpiredAppointment = (appointment) => {
    if (!appointment?.time) return false;
    const aptDate = appointment.time?.toDate
      ? appointment.time.toDate()
      : new Date(appointment.time);
    return (Date.now() - aptDate.getTime()) / (1000 * 60) > 60;
  };

  const handleReschedule = (appointment) => {
    if (isExpiredAppointment(appointment)) {
      alert("This appointment has expired and cannot be rescheduled.");
      return;
    }
    setRescheduleAppointment(appointment);
  };

  const handleCancel = (appointment) => {
    if (isExpiredAppointment(appointment)) {
      alert("This appointment has expired and cannot be cancelled.");
      return;
    }
    setCancelAppointment(appointment);
  };

  const handleActionSuccess = (message) => {
    setStatusMessage(message);
    setTimeout(() => {
      setStatusMessage(null);
    }, 5000);
  };

  const hasAnyAppointments =
    currentAppointments.length > 0 ||
    pendingAppointments.length > 0 ||
    upcomingAppointments.length > 0;

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-sans font-semibold text-white tracking-tight">
          Upcoming Consultations
        </h2>
        {hasAnyAppointments && (
          <button
            onClick={() => router.push("/doctor/consultations")}
            className="text-xs text-[#FFD3AC] hover:underline font-sans font-medium"
          >
            View All
          </button>
        )}
      </div>

      {/* Status Message Toast */}
      {statusMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in duration-200">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-sans font-medium">{statusMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-2 border-[#FFD3AC] border-t-transparent"></div>
        </div>
      ) : !hasAnyAppointments ? (
        <div className="bg-[#2D2D30]/70 border border-white/5 rounded-[22px] p-6 text-center">
          <CalendarIcon className="w-12 h-12 text-white/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white font-sans">
            No Upcoming Consultations
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm font-sans mt-1">
            Appointments will appear here when clients book.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Current Appointments (Happening Now) */}
          {currentAppointments.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFD3AC] font-sans">
                HAPPENING NOW
              </h3>
              <div className="space-y-3">
                {currentAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-[#FFD3AC] text-[#1E1E1E] rounded-2xl p-5 shadow-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-lg font-sans">
                          {appointment.user_name || "Client"}
                        </h4>
                        <p className="text-black/75 flex items-center mt-1 text-sm font-sans">
                          <ClockIcon className="h-4 w-4 mr-1 text-[#1E1E1E]" />
                          {formatAppointmentTime(appointment.time)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          router.push(
                            `/doctor/consultations/appointment/${appointment.id}`
                          )
                        }
                        className="flex items-center justify-center gap-2 bg-[#1E1E1E] text-[#FFD3AC] px-6 py-2.5 rounded-full font-semibold font-sans text-sm hover:bg-black transition shadow cursor-pointer"
                      >
                        <VideoCameraIcon className="h-4 w-4" />
                        JOIN CALL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Appointments */}
          {pendingAppointments.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                  PENDING APPOINTMENTS
                </h3>
                <span className="bg-[#FFD3AC]/20 text-[#FFD3AC] border border-[#FFD3AC]/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Pending
                </span>
              </div>
              <div className="space-y-3">
                {pendingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/doctor/consultations/appointment/${appointment.id}`
                          )
                        }
                      >
                        <h4 className="font-semibold text-base text-white hover:text-[#FFD3AC] transition font-sans">
                          {appointment.user_name || "Client"}
                        </h4>
                        <p className="text-gray-400 flex items-center mt-1 text-xs font-sans">
                          <ClockIcon className="h-3.5 w-3.5 mr-1 text-[#FFD3AC]" />
                          {formatAppointmentTime(appointment.time)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/doctor/consultations/appointment/${appointment.id}`
                            )
                          }
                          className="px-4 py-1.5 bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe3c9] rounded-full transition cursor-pointer font-semibold text-xs"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleReschedule(appointment)}
                          className="px-4 py-1.5 bg-[#2D2D30] text-white border border-white/10 hover:bg-[#3D3D42] rounded-full transition cursor-pointer text-xs"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(appointment)}
                          className="px-4 py-1.5 bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 rounded-full transition cursor-pointer text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                UPCOMING
              </h3>
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-white/20 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/doctor/consultations/appointment/${appointment.id}`
                          )
                        }
                      >
                        <h4 className="font-semibold text-base text-white hover:text-[#FFD3AC] transition font-sans">
                          {appointment.user_name || "Client"}
                        </h4>
                        <p className="text-gray-400 flex items-center mt-1 text-xs font-sans">
                          <ClockIcon className="h-3.5 w-3.5 mr-1 text-[#FFD3AC]" />
                          {formatAppointmentTime(appointment.time)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/doctor/consultations/appointment/${appointment.id}`
                            )
                          }
                          className="px-4 py-1.5 bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe3c9] rounded-full transition cursor-pointer font-semibold text-xs"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleReschedule(appointment)}
                          className="px-4 py-1.5 bg-[#2D2D30] text-white border border-white/10 hover:bg-[#3D3D42] rounded-full transition cursor-pointer text-xs"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(appointment)}
                          className="px-4 py-1.5 bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 rounded-full transition cursor-pointer text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelAppointment && (
        <CancelConsultationModal
          appointment={cancelAppointment}
          doctorUid={user?.uid}
          onClose={() => setCancelAppointment(null)}
          onSuccess={handleActionSuccess}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <RescheduleConsultationModal
          appointment={rescheduleAppointment}
          doctorUid={user?.uid}
          onClose={() => setRescheduleAppointment(null)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
