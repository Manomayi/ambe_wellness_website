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
      (snapshot) => {
        const reports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReportsToFinish(reports);
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
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">
            Consultations
          </h1>
          <button
            onClick={() => router.push('/doctor/consultations/history')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FFD3AC] text-[#1E1E1E] font-sans font-semibold text-xs uppercase tracking-wider hover:bg-[#ffe3c9] transition shadow-md cursor-pointer"
          >
            <ClockIcon className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Status Message Toast */}
        {statusMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-lg animate-in fade-in duration-200">
            <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-sans font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Reports to Finish Alert matching Flutter */}
        {reportsToFinish.length > 0 && (
          <div className="space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              REPORTS TO FINISH
            </h2>
            <div className="bg-[#1B1A18]/90 border border-red-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white font-sans text-base">
                    Reports to finish
                  </h3>
                  <p className="text-gray-400 text-xs mt-0.5 font-sans">
                    You have {reportsToFinish.length} {reportsToFinish.length > 1 ? 'reports' : 'report'} to complete
                  </p>
                  <div className="mt-3.5 space-y-2">
                    {reportsToFinish.map((report) => {
                      const userUid = report.user_id || report.user_uid || report.userId || '';
                      const userName = report.user_name || report.userName || '';
                      const timeMillis = report.time?.toMillis ? report.time.toMillis() : (report.time ? new Date(report.time).getTime() : Date.now());
                      const params = new URLSearchParams({
                        userUid,
                        userName,
                        time: String(timeMillis),
                      }).toString();

                      return (
                        <div
                          key={report.id}
                          className="flex items-center justify-between bg-[#2D2D30]/70 border border-white/5 p-3 rounded-xl hover:border-white/20 transition"
                        >
                          <div>
                            <p className="font-semibold text-white text-sm font-sans">{userName || 'Patient'}</p>
                            <p className="text-xs text-gray-400 font-sans mt-0.5">
                              {formatAppointmentTime(report.time)}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/doctor/consultations/complete-report/${report.id}?${params}`)}
                            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition cursor-pointer"
                          >
                            Complete Report →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
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

        {/* Empty State */}
        {!currentAppointment && upcomingAppointments.length === 0 && pendingAppointments.length === 0 && reportsToFinish.length === 0 && !loading && (
          <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2 font-heading">No Consultations Scheduled</h3>
            <p className="text-gray-400 text-sm font-sans max-w-sm mx-auto">
              Your users can book consultations through their dashboard.
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