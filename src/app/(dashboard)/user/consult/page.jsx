"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
import { db, functions } from "@/lib/firebase/config";
import { matchUserWithDoctor } from "@/lib/doctorMatching";
import UserQuestionnaireModal from "@/components/user/UserQuestionnaireModal";
import {
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  XMarkIcon
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
  unknown: "General Health"
};

const getHealthFieldLabel = (key) => {
  return HEALTH_FIELD_LABELS[key] || key;
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
  const [cancellingId, setCancellingId] = useState(null);
  const [checkingInstant, setCheckingInstant] = useState(false);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);

  // Resolve doctor UID from profile
  const resolvedDoctorUid = 
    profile?.doctor?.uid || 
    (typeof profile?.doctor === 'string' ? profile.doctor : null) || 
    profile?.doctor_uid || 
    profile?.matched_doctor || 
    profile?.doctor_id || 
    null;

  const handleCheckInstantAvailability = async () => {
    if (!user) return;
    setCheckingInstant(true);
    try {
      const result = await matchUserWithDoctor(user.uid, profile?.preferred_health || 'general_health', true);
      if (result.matched && result.doctor) {
        router.push('/user/consult/schedule?instant=true');
      } else {
        alert('No doctor is currently available for instant consult right now. Your doctor will be assigned shortly, or you can pick your health areas to match.');
      }
    } catch (err) {
      console.error('Instant availability error:', err);
      alert('Could not check instant availability. Please try again.');
    } finally {
      setCheckingInstant(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Listen to upcoming appointments without restrictive where filter
    // (matching Flutter app so active & in-progress appointments show immediately)
    const upcomingQuery = collection(db, 'users', user.uid, 'appointments_upcoming');

    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      appointments.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
        const timeB = b.time?.toDate ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
        return timeA - timeB;
      });
      setUpcomingAppointments(appointments);
    });

    // Listen to past appointments
    const pastQuery = collection(db, 'users', user.uid, 'appointments_history');

    const unsubscribePast = onSnapshot(pastQuery, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      appointments.sort((a, b) => {
        const timeA = a.time?.toDate ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
        const timeB = b.time?.toDate ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
        return timeB - timeA;
      });
      setPastAppointments(appointments);
      setLoading(false);
    });

    return () => {
      unsubscribeUpcoming();
      unsubscribePast();
    };
  }, [user]);

  useEffect(() => {
    if (resolvedDoctorUid) {
      fetchDoctorInfo(resolvedDoctorUid);
    }
  }, [resolvedDoctorUid]);

  const fetchDoctorInfo = async (doctorUid) => {
    try {
      const doctorDoc = await getDoc(doc(db, 'doctors', doctorUid));
      if (doctorDoc.exists()) {
        setDoctorInfo(doctorDoc.data());
      }
    } catch (error) {
      console.error('Error fetching doctor info:', error);
    }
  };

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
    if (!appointment?.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes >= -60 && diffMinutes <= 15; // 15 min before to 1 hr after
  };

  const isAppointmentPast = (appointment) => {
    if (!appointment?.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes < -60;
  };

  const handleCancelAppointment = async (appointment) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this appointment?\n\nRefund Policy:\n• You can request a full refund for your $50 deposit by emailing info@ambewellness.com within 30 days of the appointment.\n• If you do not join the scheduled consultation, only 50% ($25) of the deposit is refunded.'
    );
    if (!confirmCancel) return;

    setCancellingId(appointment.id);
    try {
      // Try Cloud Function first
      try {
        const cancelFn = httpsCallable(functions, 'cancelAppointmentByUser');
        await cancelFn({ appointmentId: appointment.id });
      } catch (fnErr) {
        console.warn('Cloud function cancel failed, using Firestore fallback:', fnErr);
        // Fallback: batch update
        const batch = writeBatch(db);
        const userUpcomingRef = doc(db, 'users', user.uid, 'appointments_upcoming', appointment.id);
        const userHistoryRef = doc(db, 'users', user.uid, 'appointments_history', appointment.id);
        const userRef = doc(db, 'users', user.uid);

        batch.delete(userUpcomingRef);
        batch.set(userHistoryRef, {
          ...appointment,
          status: 'cancelled_by_user',
          cancelled_at: serverTimestamp()
        }, { merge: true });
        batch.update(userRef, { is_consultation_set: false });

        const docId = appointment.doctor_id || appointment.doctor_uid || resolvedDoctorUid;
        if (docId) {
          const doctorUpcomingRef = doc(db, 'doctors', docId, 'appointments_upcoming', appointment.id);
          batch.delete(doctorUpcomingRef);
        }
        await batch.commit();
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const hasDoctor = Boolean(resolvedDoctorUid || profile?.doctor);
  const canMessage = profile?.is_first_consultation_completed || hasDoctor;

  const doctorDisplayName = 
    (doctorInfo?.first_name || doctorInfo?.last_name)
      ? `Dr. ${doctorInfo.first_name || ''} ${doctorInfo.last_name || ''}`.trim()
      : (doctorInfo?.name 
          ? (doctorInfo.name.startsWith('Dr.') ? doctorInfo.name : `Dr. ${doctorInfo.name}`)
          : (profile?.doctor_name 
              ? (profile.doctor_name.startsWith('Dr.') ? profile.doctor_name : `Dr. ${profile.doctor_name}`)
              : (profile?.doctor?.first_name 
                  ? `Dr. ${profile.doctor.first_name} ${profile.doctor.last_name || ''}`.trim() 
                  : 'Dr. Assigned Doctor')));

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Consultations</h1>

        {/* Questionnaire Modal */}
        {showQuestionnaireModal && (
          <UserQuestionnaireModal
            onComplete={() => {
              setShowQuestionnaireModal(false);
            }}
          />
        )}

        {/* 1. If Questionnaire NOT Completed */}
        {!profile?.is_free_questionnaire_completed && (
          <div className="bg-white border border-[#E7E2D9] rounded-xl p-8 mb-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-[#FFF3E8] border border-[#FFD3AC] rounded-full flex items-center justify-center mx-auto text-2xl">
              📋
            </div>
            <h3 className="font-semibold text-xl text-[#1A1A1A]">Complete Your Intake Assessment</h3>
            <p className="text-sm text-[#6B6862]">
              Complete your questionnaire so our system can analyze your unique constitution and match you with the right specialist.
            </p>
            <button 
              onClick={() => setShowQuestionnaireModal(true)}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm uppercase tracking-wider"
            >
              Start Intake Assessment
            </button>
          </div>
        )}

        {/* 2. If Questionnaire Completed but Doctor Not Yet Assigned -> Finding Your Perfect Match (Matching Image 1) */}
        {!hasDoctor && profile?.is_free_questionnaire_completed && (
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 mb-8 shadow-sm max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 bg-[#FFF3E8] border border-[#FFD3AC] rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm">
              ⏳
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-[#1A1A1A]">Finding your perfect match</h3>
              <p className="text-sm text-[#6B6862] leading-relaxed">
                We are currently looking for the best doctor specializing in your selected topic for you.
              </p>
              <p className="text-xs text-[#8C827A] pt-1">
                You will be notified as soon as a doctor is assigned.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleCheckInstantAvailability}
                disabled={checkingInstant}
                className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl text-sm font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {checkingInstant ? "Checking..." : "Check for Instant Availability"}
              </button>
              <button 
                onClick={() => router.push('/user/get-matched')}
                className="text-xs text-[#8C827A] hover:text-[#1A1A1A] underline transition"
              >
                Select different health areas
              </button>
            </div>
          </div>
        )}

        {/* Doctor Info Card */}
        {hasDoctor && (
          <>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">MY DOCTOR</h2>
            <div className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm p-6 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-[#FAF8F5] border border-[#E7E2D9] rounded-full overflow-hidden flex-shrink-0">
                    {doctorInfo?.profile_picture ? (
                      <img 
                        src={doctorInfo.profile_picture} 
                        alt={doctorDisplayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#1A1A1A] font-bold text-xl bg-[#FFD3AC]/40">
                        {doctorDisplayName.replace('Dr. ', '').charAt(0) || '👨‍⚕️'}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-lg text-[#1A1A1A]">
                      {doctorDisplayName}
                    </h3>
                    {doctorInfo?.title && (
                      <p className="text-sm text-[#C8996A] font-medium">{doctorInfo.title}</p>
                    )}
                    {doctorInfo?.field && doctorInfo.field.length > 0 && (
                      <p className="text-sm text-[#6B6862] mt-1 line-clamp-2">
                        {getHealthFieldLabels(doctorInfo.field).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => router.push('/user/consult/message_doctor')}
                    disabled={!canMessage}
                    className={`flex-1 sm:flex-initial flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
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
                    className="flex-1 sm:flex-initial flex items-center justify-center bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer shadow-sm"
                  >
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Schedule
                  </button>
                </div>
              </div>
              {!canMessage && (
                <p className="text-xs text-[#8C827A] mt-3">
                  Complete your first consultation to enable direct messaging
                </p>
              )}
            </div>
          </>
        )}

        {/* Upcoming / Current Appointments */}
        {upcomingAppointments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              {upcomingAppointments.some(a => isAppointmentNow(a)) 
                ? 'HAPPENING NOW' 
                : 'UPCOMING APPOINTMENTS'}
            </h2>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => {
                const isNow = isAppointmentNow(appointment);
                const isPast = isAppointmentPast(appointment);
                const apptDocName = appointment.doctor_name 
                  ? (appointment.doctor_name.startsWith('Dr.') ? appointment.doctor_name : `Dr. ${appointment.doctor_name}`)
                  : doctorDisplayName;

                return (
                  <div key={appointment.id}>
                    <div className={`bg-white border rounded-xl shadow-sm p-6 ${
                      isNow ? 'border-[#C8996A] ring-2 ring-[#FFD3AC]' : 'border-[#E7E2D9]'
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {isNow && (
                              <span className="bg-[#2E7D32] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                                Live
                              </span>
                            )}
                            <h3 className="font-semibold text-lg text-[#1A1A1A]">
                              {apptDocName}
                            </h3>
                          </div>
                          <p className="text-sm text-[#6B6862] flex items-center mt-1">
                            <ClockIcon className="h-4 w-4 mr-1.5 text-[#C8996A]" />
                            {formatAppointmentTime(appointment.time)}
                          </p>
                          {isPast && (
                            <p className="text-xs text-[#8C827A] mt-1">
                              Consultation in progress or pending completion report
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {isNow && (
                            <button
                              onClick={() => router.push(`/user/consult/appointment/${appointment.id}`)}
                              className="flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer shadow-sm bg-[#1A1A1A] hover:bg-[#353535] text-[#FFD3AC]"
                            >
                              <VideoCameraIcon className="h-5 w-5 mr-2" />
                              Join Call
                            </button>
                          )}
                          
                          {!isNow && !isPast && (
                            <>
                              <button
                                onClick={() => router.push('/user/consult/schedule')}
                                className="px-4 py-2.5 border border-[#E7E2D9] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#FAF8F5] transition cursor-pointer"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(appointment)}
                                disabled={cancellingId === appointment.id}
                                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                              >
                                {cancellingId === appointment.id ? 'Cancelling...' : 'Cancel'}
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
        {hasDoctor && upcomingAppointments.length === 0 && !loading && (
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
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer"
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
                        {appointment.doctor_name?.startsWith('Dr.') ? appointment.doctor_name : `Dr. ${appointment.doctor_name || 'Assigned Doctor'}`}
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