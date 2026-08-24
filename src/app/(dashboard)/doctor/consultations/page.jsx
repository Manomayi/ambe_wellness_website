"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  VideoCameraIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

export default function DoctorConsultationsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [reportsToFinish, setReportsToFinish] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
          const diffMinutes = (aptDate - nowDate) / (1000 * 60);

          if (diffMinutes >= -60 && diffMinutes <= 15 && !current) {
            current = apt;
          } else {
            upcoming.push(apt);
          }
        });

        setCurrentAppointment(current);
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

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setShowModal(true);
  };

  const handleCancel = async (appointmentId) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      // TODO: Implement cancellation logic with cloud function
      alert('Cancellation functionality coming soon');
    }
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

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Upcoming Appointments</h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => router.push(`/doctor/consultations/appointment/${appointment.id}`)}
                    >
                      <h3 className="font-semibold text-lg hover:text-[#C8996A] transition">{appointment.user_name}</h3>
                      <p className="text-[#6B6862] flex items-center mt-1">
                        <ClockIcon className="h-4 w-4 mr-1" />
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
                        onClick={() => handleCancel(appointment.id)}
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
        {!currentAppointment && upcomingAppointments.length === 0 && reportsToFinish.length === 0 && !loading && (
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

        {/* Reschedule Modal */}
        {showModal && selectedAppointment && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-4">
                Reschedule Appointment
              </h3>
              <p className="text-[#6B6862] mb-4">
                Current time: {formatAppointmentTime(selectedAppointment.time)}
              </p>
              <div className="space-y-3">
                <button
                  className="w-full py-2 text-left hover:bg-[#F4F1EA] rounded px-3"
                  onClick={() => {
                    setShowModal(false);
                    alert('Reschedule functionality coming soon');
                  }}
                >
                  Choose New Time
                </button>
                <button
                  className="w-full py-2 text-left hover:bg-[#F4F1EA] rounded px-3 text-red-600"
                  onClick={() => {
                    setShowModal(false);
                    handleCancel(selectedAppointment.id);
                  }}
                >
                  Cancel Appointment
                </button>
              </div>
              <button
                className="mt-4 w-full text-center text-[#8C827A] hover:text-[#1A1A1A]"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}