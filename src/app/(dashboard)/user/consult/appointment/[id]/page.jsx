"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import VideoCall from '@/components/video/VideoCall';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';

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
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!appointment) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">Appointment Not Found</h2>
          <p className="text-sm text-[#6B6862] mb-6">
            The appointment you're looking for doesn't exist or has been cancelled.
          </p>
          <button
            onClick={() => router.push('/user/consult')}
            className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-sm"
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
        otherPartyUid={appointment.doctor_id}
        isDoctor={false}
        onCallEnd={handleCallEnd}
      />
    );
  }

  const isAppointmentNow = () => {
    if (!appointment.time) return false;
    const appointmentTime = appointment.time.toDate ? appointment.time.toDate() : new Date(appointment.time);
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes >= -60 && diffMinutes <= 15;
  };

  const canJoinCall = isAppointmentNow() && !appointment.completed;

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.push('/user/consult')}
          className="text-[#6B6862] hover:text-[#1A1A1A] text-sm flex items-center font-medium"
        >
          ← Back to Consultations
        </button>

        <div className="bg-white border border-[#E7E2D9] rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-6">
            Video Consultation
          </h1>

          {/* Doctor Info */}
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-white border border-[#E7E2D9] rounded-full flex items-center justify-center">
                <UserIcon className="w-7 h-7 text-[#C8996A]" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-lg text-[#1A1A1A]">
                  Dr. {appointment.doctor_name}
                </h3>
                <p className="text-xs text-[#8C827A] uppercase tracking-wider">Healthcare Provider</p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center text-sm text-[#1A1A1A]">
              <CalendarIcon className="w-5 h-5 mr-3 text-[#C8996A]" />
              <span>{formatAppointmentTime(appointment.time)}</span>
            </div>
            {appointment.duration && (
              <div className="flex items-center text-sm text-[#1A1A1A]">
                <ClockIcon className="w-5 h-5 mr-3 text-[#C8996A]" />
                <span>Duration: {appointment.duration}</span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {appointment.completed && (
            <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl p-4 mb-6">
              <p className="text-sm text-[#6B6862]">
                This appointment has been completed. To view the consultation report, 
                please visit your consultation history.
              </p>
            </div>
          )}

          {!appointment.completed && !canJoinCall && (
            <div className="bg-[#FAF8F5] border border-[#C8996A]/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-[#353535]">
                Your appointment is scheduled for {formatAppointmentTime(appointment.time)}.
                You can join the call 15 minutes before the scheduled time.
              </p>
            </div>
          )}

          {canJoinCall && (
            <div className="bg-[#FAF8F5] border border-[#C8996A] rounded-xl p-4 mb-6">
              <p className="text-[#1A1A1A] font-semibold text-sm mb-1">
                Your appointment is happening now!
              </p>
              <p className="text-xs text-[#6B6862]">
                Click the button below to join the video consultation with your doctor.
              </p>
            </div>
          )}

          {/* Join Call Button */}
          {canJoinCall && (
            <button
              onClick={() => setInCall(true)}
              className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 rounded-xl transition flex items-center justify-center text-base font-semibold uppercase tracking-wider shadow-sm"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Join Video Call
            </button>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900">Before joining:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure you have a stable internet connection</li>
              <li>• Test your camera and microphone</li>
              <li>• Find a quiet, well-lit space</li>
              <li>• Have any relevant medical information ready</li>
              <li>• <strong>Attendance & Refund Policy:</strong> Please join your call on time. If you do not attend the scheduled consultation, only 50% ($25) of the deposit is refunded. For refund inquiries within 30 days, contact <a href="mailto:info@ambewellness.com" className="underline font-semibold">info@ambewellness.com</a>.</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}