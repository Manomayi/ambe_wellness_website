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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Consultations</h1>
          <button
            onClick={() => router.push('/doctor/consultations/history')}
            className="bg-[#FFD3AC] text-[#1A1A1A] hover:text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition cursor-pointer"
          >
            View History
          </button>
        </div>

        {/* Status Message Toast */}
        {statusMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in duration-200">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Reports to Finish Alert */}
        {reportsToFinish.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Reports to Complete</h3>
                <p className="text-red-700 text-sm mt-1">
                  You have {reportsToFinish.length} consultation report{reportsToFinish.length > 1 ? 's' : ''} to complete.
                </p>
                <div className="mt-4 space-y-2">
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
                        className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm"
                      >
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{userName || 'Patient'}</p>
                          <p className="text-sm text-[#6B6862]">
                            {formatAppointmentTime(report.time)}
                          </p>
                        </div>
                        <button
                          onClick={() => router.push(`/doctor/consultations/complete-report/${report.id}?${params}`)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm cursor-pointer"
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
        )}

        {/* Current Appointment (Happening Now) */}
        {currentAppointment && (
          <div className="bg-[#F4F1EA] border-2 border-[#C8996A] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Happening Now</h2>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentAppointment.user_name}</h3>
                  <p className="text-[#6B6862] flex items-center mt-1">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatAppointmentTime(currentAppointment.time)}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/doctor/consultations/appointment/${currentAppointment.id}`)}
                  className="flex items-center bg-[#FFD3AC] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition"
                >
                  <VideoCameraIcon className="h-5 w-5 mr-2" />
                  Join Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Appointments (Missed / Past Due) */}
        {pendingAppointments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Pending Appointments</h2>
              <span className="bg-[#FFF3E8] text-[#C8996A] border border-[#FFD3AC] text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pending
              </span>
            </div>
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow border border-[#E7E2D9] p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg hover:text-[#C8996A] transition text-[#1A1A1A]">
                          {appointment.user_name || 'Patient'}
                        </h3>
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded">
                          Past Due
                        </span>
                      </div>
                      <p className="text-[#6B6862] flex items-center mt-1 text-sm">
                        <ClockIcon className="h-4 w-4 mr-1 text-[#C8996A]" />
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                        className="px-4 py-2 bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-lg transition cursor-pointer font-medium text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleReschedule(appointment)}
                        className="px-4 py-2 border border-[#E7E2D9] rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer text-sm"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(appointment)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer text-sm"
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
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-[#1A1A1A]">Upcoming Appointments</h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                    >
                      <h3 className="font-semibold text-lg hover:text-[#C8996A] transition text-[#1A1A1A]">
                        {appointment.user_name || 'Patient'}
                      </h3>
                      <p className="text-[#6B6862] flex items-center mt-1 text-sm">
                        <ClockIcon className="h-4 w-4 mr-1 text-[#C8996A]" />
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                        className="px-4 py-2 bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white rounded-lg transition cursor-pointer font-medium text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleReschedule(appointment)}
                        className="px-4 py-2 border border-[#E7E2D9] rounded-lg hover:bg-[#FAF8F5] transition cursor-pointer text-sm"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(appointment)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer text-sm"
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
          <div className="bg-[#FAF8F5] rounded-lg p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-[#8C827A] mx-auto mb-4" />
            <h3 className="text-xl font-medium text-[#353535] mb-2">No Consultations Scheduled</h3>
            <p className="text-[#6B6862]">
              Your users can book consultations through their dashboard.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
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