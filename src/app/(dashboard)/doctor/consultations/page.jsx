"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  VideoCameraIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import CancelConsultationModal from "@/components/doctor/CancelConsultationModal";
import RescheduleConsultationModal from "@/components/doctor/RescheduleConsultationModal";

export default function DoctorConsultationsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [reportsToFinish, setReportsToFinish] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);

  const resolvingSetRef = useRef(new Set());

  const autoResolveExpiredConsultation = async (apt, docId) => {
    if (!user) return;
    const appointmentId = (apt.appointment_id || docId || '').toString();
    if (!appointmentId || resolvingSetRef.current.has(appointmentId)) return;
    resolvingSetRef.current.add(appointmentId);

    const userUid = apt.user_id || apt.user_uid || apt.userId;
    const doctorUid = user.uid;

    const userJoined = apt.user_joined === true;
    const doctorJoined = apt.doctor_joined === true;

    let resolvedStatus = "no_show";
    let isNoShow = true;
    if (userJoined && doctorJoined) {
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

      const docUpcomingRef = doc(db, 'doctors', doctorUid, 'appointments_upcoming', appointmentId);
      const docHistoryRef = doc(db, 'doctors', doctorUid, 'appointments_history', appointmentId);
      batch.delete(docUpcomingRef);
      batch.set(docHistoryRef, historyData, { merge: true });

      if (userUid) {
        const userUpcomingRef = doc(db, 'users', userUid, 'appointments_upcoming', appointmentId);
        const userHistoryRef = doc(db, 'users', userUid, 'appointments_history', appointmentId);
        batch.delete(userUpcomingRef);
        batch.set(userHistoryRef, historyData, { merge: true });
        batch.update(doc(db, 'users', userUid), { is_consultation_set: false });
      }

      const consultRef = doc(db, 'consultations', appointmentId);
      batch.set(consultRef, {
        status: resolvedStatus,
        is_no_show: isNoShow,
        auto_resolved: true,
        resolved_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      await batch.commit();
      console.log(`Doctor auto-resolved expired consultation ${appointmentId} to ${resolvedStatus}`);
    } catch (e) {
      console.warn("Doctor error auto-resolving expired consultation:", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Listen to upcoming appointments without restrictive where query
    const upcomingCol = collection(db, 'doctors', user.uid, 'appointments_upcoming');

    const unsubscribeUpcoming = onSnapshot(
      upcomingCol,
      (snapshot) => {
        const appointments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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

        const nowDate = new Date();
        let current = null;
        const pending = [];
        const upcoming = [];

        appointments.forEach((apt) => {
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

          if (diffMinutes >= -60 && diffMinutes <= 15 && !current) {
            current = apt;
          } else if (diffMinutes < -60) {
            // Expired past 60m: auto-resolve to history and do not show in pending
            autoResolveExpiredConsultation(apt, apt.id);
          } else {
            upcoming.push(apt);
          }
        });

        setCurrentAppointment(current);
        setPendingAppointments(pending);
        setUpcomingAppointments(upcoming);
      },
      (error) => {
        if (error?.code === 'permission-denied') return;
        console.error('Error listening to upcoming appointments:', error);
      }
    );

    // Listen to reports to finish
    const reportsCol = collection(
      db,
      'doctors',
      user.uid,
      'appointments_reports_to_finish'
    );

    const unsubscribeReports = onSnapshot(
      reportsCol,
      async (snapshot) => {
        const activeReports = [];
        for (const docSnap of snapshot.docs) {
          const repData = docSnap.data();
          const repId = docSnap.id;
          const candidateHistoryIds = [
            repId,
            decodeURIComponent(repId),
            repData.appointment_id,
            repData.original_appointment_id,
            repData.consultation_id,
            repData.document_id,
          ].filter(Boolean);

          let alreadyInHistory = repData.status === 'completed' || repData.consultation_outcome === 'completed';
          if (!alreadyInHistory) {
            for (const hId of candidateHistoryIds) {
              try {
                const hSnap = await getDoc(doc(db, 'doctors', user.uid, 'appointments_history', String(hId)));
                if (hSnap.exists()) {
                  alreadyInHistory = true;
                  break;
                }
              } catch (_) {}
            }
          }

          if (alreadyInHistory) {
            // Self-healing: remove completed report left behind in appointments_reports_to_finish
            console.log(`Auto-cleaning already completed report ${repId} from appointments_reports_to_finish`);
            try {
              await deleteDoc(doc(db, 'doctors', user.uid, 'appointments_reports_to_finish', repId));
            } catch (_) {}
          } else {
            activeReports.push({ id: repId, ...repData });
          }
        }
        setReportsToFinish(activeReports);
        setLoading(false);
      },
      (error) => {
        if (error?.code === 'permission-denied') return;
        console.error('Error listening to reports to finish:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUpcoming();
      unsubscribeReports();
    };
  }, [user]);

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const isExpiredAppointment = (appointment) => {
    if (!appointment?.time) return false;
    const aptDate = appointment.time?.toDate ? appointment.time.toDate() : new Date(appointment.time);
    return (Date.now() - aptDate.getTime()) / (1000 * 60) > 60;
  };

  const handleReschedule = (appointment) => {
    if (isExpiredAppointment(appointment)) {
      alert('This appointment has expired and cannot be rescheduled.');
      return;
    }
    setRescheduleAppointment(appointment);
  };

  const handleCancel = (appointment) => {
    if (isExpiredAppointment(appointment)) {
      alert('This appointment has expired and cannot be cancelled.');
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

  return (
    <ProtectedRoute userType="doctor">
      <div className="space-y-6 select-none">
        {/* Top bar matching Flutter ConsultationsPage */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal tracking-tight">
            Consultations
          </h1>
          <button
            onClick={() => router.push('/doctor/consultations/history')}
            className="text-[#FFD3AC] hover:opacity-80 transition p-1 cursor-pointer"
            aria-label="Consultation History"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3a9 9 0 00-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21a9 9 0 000-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
            </svg>
          </button>
        </div>

        {/* Status Message Toast */}
        {statusMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in duration-200">
            <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-sans font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Reports to Finish Alert matching Flutter Image 2 */}
        {reportsToFinish.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-sans">
              REPORTS TO FINISH
            </h2>
            <div
              onClick={() => {
                const r = reportsToFinish[0];
                const userUid = r.user_id || r.user_uid || r.userId || '';
                const userName = r.user_name || r.userName || '';
                const timeMillis = r.time?.toMillis ? r.time.toMillis() : (r.time ? new Date(r.time).getTime() : Date.now());
                const params = new URLSearchParams({
                  userUid,
                  userName,
                  time: String(timeMillis),
                }).toString();
                router.push(`/doctor/consultations/complete-report/${encodeURIComponent(r.id)}?${params}`);
              }}
              className="bg-[#2D2D30] border border-red-500/30 rounded-[20px] p-4 sm:p-5 flex items-center justify-between hover:bg-[#353539] transition shadow-md cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[14px] bg-red-950/40 border border-red-500/30 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white font-sans text-base sm:text-lg">
                    Reports to finish
                  </h3>
                  <p className="text-gray-400 text-sm font-sans mt-0.5">
                    {reportsToFinish.length} {reportsToFinish.length > 1 ? 'reports' : 'report'}
                  </p>
                </div>
              </div>
              <svg className="w-6 h-6 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}

        {/* Current Appointment (Happening Now) matching Flutter */}
        {currentAppointment && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FFD3AC] font-sans">
              HAPPENING NOW
            </h2>
            <div className="bg-[#FFD3AC] text-[#1E1E1E] rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg font-sans">{currentAppointment.user_name || 'Patient'}</h3>
                  <p className="text-black/75 flex items-center mt-1 text-sm font-sans">
                    <ClockIcon className="h-4 w-4 mr-1 text-[#1E1E1E]" />
                    {formatAppointmentTime(currentAppointment.time)}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/doctor/consultations/appointment/${currentAppointment.id}`)}
                  className="flex items-center justify-center gap-2 bg-[#1E1E1E] text-[#FFD3AC] px-6 py-2.5 rounded-full font-semibold font-sans text-sm hover:bg-black transition shadow cursor-pointer"
                >
                  <VideoCameraIcon className="h-4 w-4" />
                  JOIN CALL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Appointments */}
        {pendingAppointments.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
                PENDING APPOINTMENTS
              </h2>
              <span className="bg-[#FFD3AC]/20 text-[#FFD3AC] border border-[#FFD3AC]/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pending
              </span>
            </div>
            <div className="space-y-3">
              {pendingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                    >
                      <h3 className="font-semibold text-base text-white hover:text-[#FFD3AC] transition font-sans">
                        {appointment.user_name || 'Patient'}
                      </h3>
                      <p className="text-gray-400 flex items-center mt-1 text-xs font-sans">
                        <ClockIcon className="h-3.5 w-3.5 mr-1 text-[#FFD3AC]" />
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              UPCOMING
            </h2>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-4 sm:p-5 hover:border-white/20 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                    >
                      <h3 className="font-semibold text-base text-white hover:text-[#FFD3AC] transition font-sans">
                        {appointment.user_name || 'Patient'}
                      </h3>
                      <p className="text-gray-400 flex items-center mt-1 text-xs font-sans">
                        <ClockIcon className="h-3.5 w-3.5 mr-1 text-[#FFD3AC]" />
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
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

        {/* Empty State matching Flutter Image 2 */}
        {!currentAppointment && upcomingAppointments.length === 0 && pendingAppointments.length === 0 && !loading && (
          <div className="py-16 sm:py-24 text-center">
            <svg
              className="w-20 h-20 text-white/30 mx-auto"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl sm:text-2xl font-bold text-white font-sans mt-6">
              No Consultations Scheduled
            </h3>
            <p className="text-gray-400 text-sm sm:text-base font-sans mt-3 max-w-sm mx-auto leading-relaxed">
              You don&apos;t have any consultations scheduled yet.
              <br />
              They will appear here once patients book appointments.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent"></div>
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
    </ProtectedRoute>
  );
}