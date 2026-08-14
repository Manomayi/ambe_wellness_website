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
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Consultations</h1>

        {/* No Doctor Assigned */}
        {!profile?.doctor && (
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-6 mb-8 shadow-sm">
            <div className="flex items-start">
              <ExclamationCircleIcon className="h-6 w-6 text-[#C8996A] mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg text-[#1A1A1A]">No Healthcare Provider Assigned</h3>
                <p className="text-sm text-[#6B6862] mt-1">
                  Complete your health assessment to get matched with a healthcare provider.
                </p>
                <button 
                  onClick={() => router.push('/user/get-matched')}
                  className="mt-3 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition"
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
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">MY DOCTOR</h2>
            <div className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-[#FAF8F5] border border-[#E7E2D9] rounded-full overflow-hidden">
                    {doctorInfo?.profile_picture ? (
                      <img 
                        src={doctorInfo.profile_picture} 
                        alt={`Dr. ${doctorInfo.first_name} ${doctorInfo.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">👨‍⚕️</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg text-[#1A1A1A]">
                      Dr. {doctorInfo?.first_name || profile.doctor.first_name} {doctorInfo?.last_name || profile.doctor.last_name}
                    </h3>
                    {doctorInfo?.title && (
                      <p className="text-sm text-[#C8996A] font-medium">{doctorInfo.title}</p>
                    )}
                    {doctorInfo?.field && doctorInfo.field.length > 0 && (
                      <p className="text-sm text-[#6B6862] mt-1">
                        {getHealthFieldLabels(doctorInfo.field).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/user/consult/message_doctor')}
                    disabled={!canMessage}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition ${
                      canMessage 
                        ? 'bg-[#1A1A1A] text-white hover:bg-[#353535]' 
                        : 'bg-[#FAF8F5] text-[#8C827A] cursor-not-allowed border border-[#E7E2D9]'
                    }`}
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                    Message
                  </button>
                  <button
                    onClick={() => router.push('/user/consult/schedule')}
                    className="flex items-center bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Schedule
                  </button>
                </div>
              </div>
              {!canMessage && (
                <p className="text-sm text-[#8C827A] mt-3">
                  Complete your first consultation to enable messaging
                </p>
              )}
            </div>
          </>
        )}

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">UPCOMING APPOINTMENTS</h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const isNow = isAppointmentNow(appointment);
                return (
                  <div key={appointment.id}>
                    {isNow && (
                      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">HAPPENING NOW</h3>
                    )}
                    <div className={`bg-white border rounded-xl shadow-sm p-6 ${
                      isNow ? 'border-[#C8996A] ring-2 ring-[#FFD3AC]' : 'border-[#E7E2D9]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg text-[#1A1A1A]">
                            Dr. {appointment.doctor_name}
                          </h3>
                          <p className="text-sm text-[#6B6862] flex items-center mt-1">
                            <ClockIcon className="h-4 w-4 mr-1 text-[#C8996A]" />
                            {formatAppointmentTime(appointment.time)}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          {isNow ? (
                            <button
                              onClick={() => router.push(`/user/consult/appointment/${appointment.id}`)}
                              className="flex items-center bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-sm"
                            >
                              <VideoCameraIcon className="h-5 w-5 mr-2" />
                              Join Call
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => router.push('/user/consult/schedule')}
                                className="px-4 py-2 border border-[#E7E2D9] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => alert('Cancel functionality coming soon')}
                                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
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
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 text-center mb-8 shadow-sm">
            <CalendarIcon className="h-12 w-12 text-[#C8996A] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
              No Upcoming Appointments
            </h3>
            <p className="text-sm text-[#6B6862] mb-4">
              Schedule a consultation with your healthcare provider
            </p>
            <button
              onClick={() => router.push('/user/consult/schedule')}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              Schedule Consultation
            </button>
          </div>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Consultation History</h2>
            <div className="space-y-3">
              {pastAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/user/consult/report/${appointment.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-base text-[#1A1A1A]">
                        Dr. {appointment.doctor_name}
                      </h4>
                      <p className="text-sm text-[#6B6862]">
                        {formatAppointmentTime(appointment.time)}
                      </p>
                    </div>
                    <div className="flex items-center text-[#C8996A]">
                      <DocumentTextIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">View Report</span>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}