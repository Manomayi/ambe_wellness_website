"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import VideoCall from '@/components/video/VideoCall';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';

export default function UserAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
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
        doc(db, 'users', user.uid, 'appointments_upcoming', params.id)
      );
      
      if (appointmentDoc.exists()) {
        setAppointment({
          id: appointmentDoc.id,
          ...appointmentDoc.data()
        });
      } else {
        // Check in completed appointments
        const completedDoc = await getDoc(
          doc(db, 'users', user.uid, 'appointments_history', params.id)
        );
        
        if (completedDoc.exists()) {
          setAppointment({
            id: completedDoc.id,
            ...completedDoc.data(),
            completed: true
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
    try {
      await updateDoc(
        doc(db, 'users', user.uid, 'appointments_upcoming', params.id),
        {
          call_ended_at: new Date()
        }
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
    }

    if (endedByDoctor) {
      // Resolve doctor UID from appointment or user profile
      const doctorUid = 
        appointment?.doctor_id || 
        appointment?.doctor_uid || 
        profile?.doctor?.uid || 
        (typeof profile?.doctor === 'string' ? profile.doctor : '') || 
        profile?.doctor_uid || 
        '';
      const doctorName = 
        appointment?.doctor_name || 
        profile?.doctor_name || 
        (profile?.doctor?.first_name ? `${profile.doctor.first_name} ${profile.doctor.last_name || ''}`.trim() : '') || 
        '';

      const query = new URLSearchParams();
      if (doctorUid) query.set('doctorUid', doctorUid);
      if (doctorName) query.set('doctorName', doctorName);
      if (params.id) query.set('appointmentId', params.id);

      router.push(`/user/consult/feedback?${query.toString()}`);
    } else {
      // User cut the call -> return back to consultations
      router.push('/user/consult');
    }
  };

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!appointment) {
    return (
      <ProtectedRoute userType="user">
        <WebLayoutWrapper>
          <div className="max-w-4xl mx-auto p-6 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white mb-2">Appointment Not Found</h2>
            <p className="text-sm text-white/60 mb-6">
              The appointment you're looking for doesn't exist or has been cancelled.
            </p>
            <button
              onClick={() => router.push('/user/consult')}
              className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-6 py-3 rounded-full text-sm font-bold transition shadow-md cursor-pointer"
            >
              Back to Consultations
            </button>
          </div>
        </WebLayoutWrapper>
      </ProtectedRoute>
    );
  }

  if (inCall) {
    return (
      <VideoCall
        appointmentId={params.id}
        userId={user.uid}
        otherPartyUid={appointment.doctor_id}
        isDoctor={false}
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

  const canJoinCall = isAppointmentNow() && !appointment.completed;

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="space-y-6 pb-24">
          <div className="flex items-center gap-4 pt-2">
            <AmbeBackButton onClick={() => router.push('/user/consult')} />
            <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
              Video Consultation
            </h1>
          </div>

          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl">
            {/* Doctor Info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-black/30 border border-[#FFD3AC]/40 rounded-full flex items-center justify-center shrink-0">
                <UserIcon className="w-7 h-7 text-[#FFD3AC]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-white truncate">
                  Dr. {appointment.doctor_name}
                </h3>
                <p className="text-xs text-white/60 uppercase tracking-wider">
                  {appointment.doctor_title || appointment.doctor?.title || appointment.doctor?.professional_title || "Healthcare Provider"}
                </p>
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
            {appointment.completed && (
              <div className="bg-[#FFD3AC]/15 border border-[#FFD3AC]/30 rounded-2xl p-5 mb-6">
                <p className="text-[#FFD3AC] text-sm font-medium">
                  This appointment has been completed. To view the consultation report, 
                  please visit your consultation history.
                </p>
              </div>
            )}

            {!appointment.completed && isAppointmentPast() && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    Past Due
                  </span>
                  <p className="text-white font-semibold text-sm">
                    This consultation time has passed
                  </p>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  The consultation report will appear in your history once submitted by your doctor.
                </p>
              </div>
            )}

            {!appointment.completed && !canJoinCall && !isAppointmentPast() && (
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
                  Click the button below to join the video consultation with your doctor.
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
                Join Video Call
              </button>
            )}

            {/* Instructions */}
            <div className="mt-8 bg-black/20 border border-white/10 rounded-2xl p-5 space-y-2">
              <h4 className="font-semibold text-white text-sm mb-2">Before joining:</h4>
              <ul className="text-xs text-white/70 space-y-1.5 leading-relaxed">
                <li>• Ensure you have a stable internet connection</li>
                <li>• Test your camera and microphone</li>
                <li>• Find a quiet, well-lit space</li>
                <li>• Have any relevant medical information ready</li>
                <li>• <strong className="text-white">Attendance & Refund Policy:</strong> Please join your call on time. If you do not attend the scheduled consultation, only 50% ($25) of the deposit is refunded. For refund inquiries within 30 days, contact <a href="mailto:info@ambewellness.com" className="text-[#FFD3AC] underline font-semibold">info@ambewellness.com</a>.</li>
              </ul>
            </div>
          </div>
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}