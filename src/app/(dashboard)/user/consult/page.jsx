"use client";

import { useState, useEffect } from "react";
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
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

// Health field mapping
const HEALTH_FIELD_LABELS = {
  general_health: "General Health",
  womens_health: "Women's Health",
  mens_health: "Men's Health",
  muscular_skeletal: "Muscular Skeletal",
  heart_health: "Heart Health",
  skin_hair_health: "Skin & Hair Health",
  mental_emotional_health: "Mental Emotional Health",
  digestive_metabolic: "Digestive & Metabolic",
  oncology: "Oncology",
  disabilities: "Disabilities",
  behavorial: "Behavorial",
  unknown: "General Health" // unknown maps to General Health
};

const getHealthFieldLabel = (key) => {
  return HEALTH_FIELD_LABELS[key] || key; // fallback to key if not found
};

const getHealthFieldLabels = (keys) => {
  if (!keys || !Array.isArray(keys)) return [];
  return keys.map(key => getHealthFieldLabel(key));
};

export default function UserConsultPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const now = Timestamp.now();

    // Listen to upcoming appointments
    const upcomingQuery = query(
      collection(db, 'users', user.uid, 'appointments_upcoming'),
      where('time', '>=', now),
      orderBy('time', 'asc')
    );

    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUpcomingAppointments(appointments);
    });

    // Listen to past appointments
    const pastQuery = query(
      collection(db, 'users', user.uid, 'appointments_completed'),
      orderBy('time', 'desc')
    );

    const unsubscribePast = onSnapshot(pastQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPastAppointments(appointments);
      setLoading(false);
    });

    return () => {
      unsubscribeUpcoming();
      unsubscribePast();
    };
  }, [user]);

  useEffect(() => {
    // Fetch doctor information if assigned
    if (profile?.doctor?.uid) {
      fetchDoctorInfo();
    }
  }, [profile]);

  const fetchDoctorInfo = async () => {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', profile.doctor.uid));
      if (doctorDoc.exists()) {
        setDoctorInfo(doctorDoc.data());
      }
    } catch (error) {
      console.error('Error fetching doctor info:', error);
    }
  };

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

  const isAppointmentNow = (appointment) => {
    if (!appointment.time) return false;
    const appointmentTime = appointment.time.toDate();
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes >= -30 && diffMinutes <= 5; // 30 min window
  };

  const canMessage = profile?.is_first_consultation_completed || profile?.doctor;

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Consultations</h1>

        {/* No Doctor Assigned */}
        {!profile?.doctor && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <ExclamationCircleIcon className="h-6 w-6 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800">No Healthcare Provider Assigned</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Complete your health assessment to get matched with a healthcare provider.
                </p>
                <button 
                  onClick={() => router.push('/user/get-matched')}
                  className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
                >
                  Get Matched Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Info Card */}
        {profile?.doctor && (
          <>
            <h2 className="text-xl font-semibold text-black mb-4">MY DOCTOR</h2>
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                    {doctorInfo?.profile_picture ? (
                      <img 
                        src={doctorInfo.profile_picture} 
                        alt={`Dr. ${doctorInfo.first_name} ${doctorInfo.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-green-100 flex items-center justify-center">
                        <span className="text-2xl">👨‍⚕️</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      Dr. {doctorInfo?.first_name || profile.doctor.first_name} {doctorInfo?.last_name || profile.doctor.last_name}
                    </h3>
                    {doctorInfo?.title && (
                      <p className="text-gray-700">{doctorInfo.title}</p>
                    )}
                    {doctorInfo?.field && doctorInfo.field.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        {getHealthFieldLabels(doctorInfo.field).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/user/consult/message_doctor')}
                  disabled={!canMessage}
                  className={`flex items-center px-4 py-2 rounded-lg transition ${
                    canMessage 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  Message
                </button>
                <button
                  onClick={() => router.push('/user/consult/schedule')}
                  className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Schedule
                </button>
              </div>
            </div>
            {!canMessage && (
              <p className="text-sm text-gray-500 mt-3">
                Complete your first consultation to enable messaging
              </p>
            )}
            </div>
          </>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-black mb-4">UPCOMING APPOINTMENTS</h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const isNow = isAppointmentNow(appointment);
                return (
                  <div key={appointment.id}>
                    {isNow && (
                      <h3 className="text-lg font-semibold text-black mb-2">HAPPENING NOW</h3>
                    )}
                    <div className={`bg-white rounded-lg shadow p-6 ${
                      isNow ? 'ring-2 ring-green-500' : ''
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Dr. {appointment.doctor_name}
                          </h3>
                          <p className="text-gray-600 flex items-center mt-1">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {formatAppointmentTime(appointment.time)}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          {isNow ? (
                            <button
                              onClick={() => router.push(`/user/consult/appointment/${appointment.id}`)}
                              className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                            >
                              <VideoCameraIcon className="h-5 w-5 mr-2" />
                              Join Call
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => router.push('/user/consult/schedule')}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => alert('Cancel functionality coming soon')}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Upcoming Appointments */}
        {profile?.doctor && upcomingAppointments.length === 0 && !loading && (
          <div className="bg-gray-50 rounded-lg p-8 text-center mb-8">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No Upcoming Appointments
            </h3>
            <p className="text-gray-600 mb-4">
              Schedule a consultation with your healthcare provider
            </p>
            <button
              onClick={() => router.push('/user/consult/schedule')}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Schedule Consultation
            </button>
          </div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Consultation History</h2>
            <div className="space-y-3">
              {pastAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/user/consult/report/${appointment.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">
                        Dr. {appointment.doctor_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <DocumentTextIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm">View Report</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}