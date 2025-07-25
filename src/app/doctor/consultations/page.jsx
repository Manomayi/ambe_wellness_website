"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  VideoCameraIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

export default function ExpertConsultationsPage() {
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

    const now = Timestamp.now();
    
    // Listen to upcoming appointments
    const upcomingQuery = query(
      collection(db, 'doctors', user.uid, 'appointments_upcoming'),
      where('time', '>=', now),
      orderBy('time', 'asc')
    );

    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check for current appointment (happening now)
      const nowDate = new Date();
      let current = null;
      const upcoming = [];
      
      appointments.forEach(apt => {
        const aptTime = apt.time.toDate();
        const diffMinutes = (aptTime - nowDate) / (1000 * 60);
        
        if (diffMinutes >= -30 && diffMinutes <= 5) {
          current = apt;
        } else if (diffMinutes > 5) {
          upcoming.push(apt);
        }
      });
      
      setCurrentAppointment(current);
      setUpcomingAppointments(upcoming);
    });

    // Listen to reports to finish
    const reportsQuery = collection(db, 'doctors', user.uid, 'appointments_reports_to_finish');
    
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReportsToFinish(reports);
      setLoading(false);
    });

    return () => {
      unsubscribeUpcoming();
      unsubscribeReports();
    };
  }, [user]);

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
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
          <h1 className="text-3xl font-bold text-gray-800">Consultations</h1>
          <button
            onClick={() => router.push('/doctor/consultations/history')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
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
                  {reportsToFinish.map((report) => (
                    <div 
                      key={report.id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{report.user_name}</p>
                        <p className="text-sm text-gray-600">
                          {formatAppointmentTime(report.time)}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/doctor/consultations/report/${report.id}`)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Complete Report →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Appointment (Happening Now) */}
        {currentAppointment && (
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Happening Now</h2>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{currentAppointment.user_name}</h3>
                  <p className="text-gray-600 flex items-center mt-1">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatAppointmentTime(currentAppointment.time)}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/doctor/consultations/appointment/${currentAppointment.id}`)}
                  className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{appointment.user_name}</h3>
                      <p className="text-gray-600 flex items-center mt-1">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReschedule(appointment)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
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
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Consultations Scheduled</h3>
            <p className="text-gray-600">
              Your users can book consultations through their dashboard.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
              <p className="text-gray-600 mb-4">
                Current time: {formatAppointmentTime(selectedAppointment.time)}
              </p>
              <div className="space-y-3">
                <button
                  className="w-full py-2 text-left hover:bg-gray-100 rounded px-3"
                  onClick={() => {
                    setShowModal(false);
                    alert('Reschedule functionality coming soon');
                  }}
                >
                  Choose New Time
                </button>
                <button
                  className="w-full py-2 text-left hover:bg-gray-100 rounded px-3 text-red-600"
                  onClick={() => {
                    setShowModal(false);
                    handleCancel(selectedAppointment.id);
                  }}
                >
                  Cancel Appointment
                </button>
              </div>
              <button
                className="mt-4 w-full text-center text-gray-500 hover:text-gray-700"
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