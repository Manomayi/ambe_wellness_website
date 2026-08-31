"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import VideoCall from '@/components/video/VideoCall';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ClockIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline';
import BackButton from '@/components/common/BackButton';

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

  const handleCallEnd = async () => {
    setInCall(false);
    try {
      await updateDoc(
        doc(db, 'doctors', user.uid, 'appointments_upcoming', params.id),
        {
          call_ended_at: new Date(),
          status: 'completed'
        }
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
    // Same next-step as the app: doctor lands directly on the
    // recommendations/report form for this consultation, not just back on
    // the list.
    const timeMillis = appointment?.time?.toMillis ? appointment.time.toMillis() : Date.now();
    const query = new URLSearchParams({
      userUid: appointment?.user_id || '',
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

  const canJoinCall = isAppointmentNow() && !appointment.needsReport;

  return (
    <ProtectedRoute userType="doctor">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <BackButton href="/doctor/consultations" label="Back to Consultations" />

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-6">
            Video Consultation
          </h1>

          {/* User Info */}
          <div className="bg-[#FAF8F5] rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-[#F4F1EA] rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-[#C8996A]" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-lg">
                  {appointment.user_name}
                </h3>
                <p className="text-[#6B6862]">User</p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center text-[#353535]">
              <CalendarIcon className="w-5 h-5 mr-3" />
              <span>{formatAppointmentTime(appointment.time)}</span>
            </div>
            {appointment.duration && (
              <div className="flex items-center text-[#353535]">
                <ClockIcon className="w-5 h-5 mr-3" />
                <span>Duration: {appointment.duration}</span>
              </div>
            )}
          </div>

          {/* Status Messages */}
          {appointment.needsReport && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800">
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
                className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
              >
                Complete Report
              </button>
            </div>
          )}

          {!appointment.needsReport && !canJoinCall && (
            <div className="bg-[#F4F1EA] border border-[#E7E2D9] rounded-lg p-4 mb-6">
              <p className="text-[#1A1A1A]">
                Your appointment is scheduled for {formatAppointmentTime(appointment.time)}.
                You can join the call 15 minutes before the scheduled time.
              </p>
            </div>
          )}

          {canJoinCall && (
            <div className="bg-[#F4F1EA] border border-[#E7E2D9] rounded-lg p-4 mb-6">
              <p className="text-emerald-700 font-medium mb-2">
                Your appointment is happening now!
              </p>
              <p className="text-emerald-700 text-sm">
                Click the button below to start the video consultation with your user.
              </p>
            </div>
          )}

          {/* Join Call Button */}
          {canJoinCall && (
            <button
              onClick={() => setInCall(true)}
              className="w-full bg-[#FFD3AC] text-[#1A1A1A] hover:text-white py-4 rounded-lg hover:bg-[#1A1A1A] transition flex items-center justify-center text-lg font-medium"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Start Video Call
            </button>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-[#F4F1EA] border border-[#E7E2D9] rounded-lg p-4">
            <h4 className="font-semibold text-[#1A1A1A] mb-2">Before the consultation:</h4>
            <ul className="text-sm text-[#1A1A1A] space-y-1">
              <li>• Review user's previous consultations if any</li>
              <li>• Ensure you have a stable internet connection</li>
              <li>• Test your camera and microphone</li>
              <li>• Have user's file ready for reference</li>
              <li>• Reuser to complete the consultation report after the call</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}