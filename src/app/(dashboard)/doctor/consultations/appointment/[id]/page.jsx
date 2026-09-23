"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import VideoCall from '@/components/video/VideoCall';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { classifyOutcome } from '@/lib/refundPolicy';
import BackButton from '@/components/common/BackButton';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import { ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

export default function DoctorAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState(false);

  useEffect(() => {
    if (user && params.id) {
      loadAppointment();
    }
  }, [user, params.id]);

  const loadAppointment = async () => {
    try {
      const appointmentDoc = await getDoc(
        doc(db, 'doctors', user.uid, 'appointments_upcoming', params.id)
      );
      
      if (appointmentDoc.exists()) {
        setAppointment({
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        });
      } else {
        // Check in reports to finish
        const reportDoc = await getDoc(
          doc(db, 'doctors', user.uid, 'appointments_reports_to_finish', params.id)
        );
        
        if (reportDoc.exists()) {
          setAppointment({
            id: reportDoc.id,
            ...reportDoc.data(),
            needsReport: true
          });
        }
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallEnd = async ({ endedByDoctor } = {}) => {
    setInCall(false);

    const patientUid = appointment?.user_id || appointment?.user_uid || appointment?.userId;

    // Read attendance back off the live consultation document before deciding
    // anything. Each client stamps its own join there, so this is the only
    // trustworthy record of who was actually in the room. Writing
    // `status: 'completed'` regardless (as this used to) is what made a call
    // the patient never joined show up as a completed consultation with a full
    // refund on their refund page.
    let liveConsultation = {};
    try {
      const snap = await getDoc(doc(db, 'consultations', params.id));
      if (snap.exists()) liveConsultation = snap.data() || {};
    } catch (error) {
      console.error('Error reading consultation attendance:', error);
    }
    const userJoined = liveConsultation.user_joined === true;
    const outcomeStatus = classifyOutcome({ userJoined, doctorJoined: true });

    const callEndedBy = liveConsultation.call_ended_by || (endedByDoctor ? 'doctor' : 'user');

    // 1. Immediately reset is_consultation_set: false on patient's profile so user can book next appointment
    if (patientUid) {
      try {
        await setDoc(
          doc(db, 'users', patientUid),
          {
            is_consultation_set: false,
            is_first_consultation_completed: true,
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error resetting is_consultation_set on patient:', error);
      }

      // 2. Mark upcoming appointment as completed for the patient
      try {
        await setDoc(
          doc(db, 'users', patientUid, 'appointments_upcoming', params.id),
          {
            status: outcomeStatus,
            consultation_outcome: outcomeStatus,
            doctor_joined: true,
            doctor_joined_at: serverTimestamp(),
            call_ended_at: serverTimestamp(),
            call_ended_by: callEndedBy,
            ...(appointment?.payment_id ? { payment_id: appointment.payment_id } : {}),
            ...(appointment?.payment_intent_id ? { payment_intent_id: appointment.payment_intent_id } : {}),
            ...(appointment?.doctor_name ? { doctor_name: appointment.doctor_name } : {}),
          },
          { merge: true }
        );
      } catch (error) {
        console.error('Error updating patient upcoming appointment:', error);
      }
    }

    // 3. Mark upcoming appointment as completed for the doctor
    try {
      await setDoc(
        doc(db, 'doctors', user.uid, 'appointments_upcoming', params.id),
        {
          call_ended_at: serverTimestamp(),
          status: outcomeStatus,
          consultation_outcome: outcomeStatus,
          doctor_joined: true,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating doctor upcoming appointment:', error);
    }

    // Calculate joint call duration if both joined
    let callDuration = null;
    let callDurationSeconds = null;
    if (userJoined && liveConsultation.user_joined_at && liveConsultation.doctor_joined_at) {
      const uMs = liveConsultation.user_joined_at.toMillis ? liveConsultation.user_joined_at.toMillis() : new Date(liveConsultation.user_joined_at).getTime();
      const dMs = liveConsultation.doctor_joined_at.toMillis ? liveConsultation.doctor_joined_at.toMillis() : new Date(liveConsultation.doctor_joined_at).getTime();
      const startMs = Math.max(uMs, dMs);
      const endMs = Date.now();
      callDurationSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));
      if (callDurationSeconds < 60) {
        callDuration = `${callDurationSeconds} sec`;
      } else {
        const mins = Math.floor(callDurationSeconds / 60);
        const remSec = callDurationSeconds % 60;
        callDuration = remSec === 0 ? `${mins} min` : `${mins} min ${remSec} sec`;
      }
    }

    // 4. Mark consultations collection document as completed
    try {
      await setDoc(
        doc(db, 'consultations', params.id),
        {
          status: outcomeStatus,
          consultation_outcome: outcomeStatus,
          call_status: 'ended',
          call_ended_by: callEndedBy,
          call_ended_at: serverTimestamp(),
          doctor_joined: true,
          doctor_id: user.uid,
          ...(callDuration ? { call_duration: callDuration, call_duration_seconds: callDurationSeconds } : {}),
          ...(patientUid ? { user_id: patientUid } : {}),
          ...(appointment?.payment_id ? { payment_id: appointment.payment_id } : {}),
          ...(appointment?.payment_intent_id ? { payment_intent_id: appointment.payment_intent_id } : {}),
          ...(appointment?.doctor_name ? { doctor_name: appointment.doctor_name } : {}),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating consultation doc:', error);
    }

    const timeMillis = appointment?.time?.toMillis ? appointment.time.toMillis() : Date.now();
    const query = new URLSearchParams({
      userUid: patientUid || '',
      userName: appointment?.user_name || '',
      time: String(timeMillis),
    });
    router.push(`/doctor/consultations/complete-report/${params.id}?${query.toString()}`);
  };

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  if (loading) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!appointment) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Appointment Not Found</h2>
          <p className="text-[#6B6862] mb-6">
            The appointment you're looking for doesn't exist or has been cancelled.
          </p>
          <button
            onClick={() => router.push('/doctor/consultations')}
            className="bg-[#FFD3AC] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition"
          >
            Back to Consultations
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  if (inCall) {
    return (
      <VideoCall
        appointmentId={params.id}
        userId={user.uid}
        otherPartyUid={appointment.user_id}
        isDoctor={true}
        onCallEnd={handleCallEnd}
        onBack={() => setInCall(false)}
      />
    );
  }

  const isAppointmentNow = () => {
    if (!appointment?.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes >= -60 && diffMinutes <= 15;
  };

  const isAppointmentPast = () => {
    if (!appointment?.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes < -60;
  };

  const canJoinCall = isAppointmentNow() && !appointment.needsReport;

  return (
    <ProtectedRoute userType="doctor">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-4 pt-2">
            <AmbeBackButton onClick={() => router.push('/doctor/consultations')} />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Video Consultation
            </h1>
          </div>

          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
            {/* User Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-black/30 border border-[#FFD3AC]/40 rounded-full flex items-center justify-center shrink-0">
                <UserIcon className="w-7 h-7 text-[#FFD3AC]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-white truncate">
                  {appointment.user_name || 'Patient'}
                </h3>
                <p className="text-xs text-white/60">Patient Consultation</p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center text-white/80 text-sm">
                <CalendarIcon className="w-5 h-5 mr-3 text-[#FFD3AC] shrink-0" />
                <span>{formatAppointmentTime(appointment.time)}</span>
              </div>
              {appointment.duration && (
                <div className="flex items-center text-white/80 text-sm">
                  <ClockIcon className="w-5 h-5 mr-3 text-[#FFD3AC] shrink-0" />
                  <span>Duration: {appointment.duration}</span>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {appointment.needsReport && (
              <div className="bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 rounded-2xl p-5 mb-6">
                <p className="text-[#FFD3AC] font-medium text-sm">
                  This appointment has been completed. Please complete the consultation report.
                </p>
                <button
                  onClick={() => {
                    const timeMillis = appointment.time?.toMillis ? appointment.time.toMillis() : Date.now();
                    const query = new URLSearchParams({
                      userUid: appointment.user_id || '',
                      userName: appointment.user_name || '',
                      time: String(timeMillis),
                    });
                    router.push(`/doctor/consultations/complete-report/${params.id}?${query.toString()}`);
                  }}
                  className="mt-3 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-5 py-2.5 rounded-full font-semibold text-sm transition shadow-md cursor-pointer"
                >
                  Complete Report
                </button>
              </div>
            )}

            {!appointment.needsReport && isAppointmentPast() && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Pending / Past Due
                  </span>
                  <p className="text-white font-semibold text-sm">
                    This consultation time has passed
                  </p>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  If the appointment was missed, please contact the patient to reschedule or cancel.
                </p>
              </div>
            )}

            {!appointment.needsReport && !canJoinCall && !isAppointmentPast() && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <p className="text-sm text-white/80 leading-relaxed">
                  Your appointment is scheduled for <span className="text-[#FFD3AC] font-medium">{formatAppointmentTime(appointment.time)}</span>.
                  You can join the call 15 minutes before the scheduled time.
                </p>
              </div>
            )}

            {canJoinCall && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-5 mb-6">
                <p className="text-emerald-400 font-semibold text-sm mb-1">
                  Your appointment is happening now!
                </p>
                <p className="text-emerald-300/80 text-xs">
                  Click the button below to start the video consultation with your patient.
                </p>
              </div>
            )}

            {/* Join Call Button */}
            {canJoinCall && (
              <button
                onClick={() => setInCall(true)}
                className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-4 rounded-full font-bold transition flex items-center justify-center text-base shadow-lg cursor-pointer"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Video Call
              </button>
            )}

            {/* Instructions */}
            <div className="mt-8 bg-black/20 border border-white/10 rounded-2xl p-5">
              <h4 className="font-semibold text-white text-sm mb-2.5">Before the consultation:</h4>
              <ul className="text-xs text-white/70 space-y-1.5 leading-relaxed">
                <li>• Review patient's previous consultations and dosha profile</li>
                <li>• Ensure you have a stable internet connection</li>
                <li>• Test your camera and microphone</li>
                <li>• Have patient file ready for reference</li>
                <li>• Complete the consultation report immediately after the call</li>
              </ul>
            </div>
          </div>
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}