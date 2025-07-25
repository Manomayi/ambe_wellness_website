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
          doc(db, 'users', user.uid, 'appointments_completed', params.id)
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

  const handleCallEnd = async () => {
    setInCall(false);
    // Optionally update appointment status
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
    router.push('/user/consult');
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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!appointment) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Appointment Not Found</h2>
          <p className="text-gray-600 mb-6">
            The appointment you're looking for doesn't exist or has been cancelled.
          </p>
          <button
            onClick={() => router.push('/user/consult')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
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
        isDoctor={false}
        onCallEnd={handleCallEnd}
      />
    );
  }

  const isAppointmentNow = () => {
    if (!appointment.time) return false;
    const appointmentTime = appointment.time.toDate();
    const now = new Date();
    const diffMinutes = (appointmentTime - now) / (1000 * 60);
    return diffMinutes >= -30 && diffMinutes <= 5;
  };

  const canJoinCall = isAppointmentNow() && !appointment.completed;

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.push('/user/consult')}
          className="mb-6 text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Consultations
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Video Consultation
          </h1>

          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-lg">
                  Dr. {appointment.doctor_name}
                </h3>
                <p className="text-gray-600">Healthcare Provider</p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center text-gray-700">
              <CalendarIcon className="w-5 h-5 mr-3" />
              <span>{formatAppointmentTime(appointment.time)}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <ClockIcon className="w-5 h-5 mr-3" />
              <span>Duration: 30 minutes</span>
            </div>
          </div>

          {/* Status Messages */}
          {appointment.completed && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
              <p className="text-gray-700">
                This appointment has been completed. To view the consultation report, 
                please visit your consultation history.
              </p>
            </div>
          )}

          {!appointment.completed && !canJoinCall && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                Your appointment is scheduled for {formatAppointmentTime(appointment.time)}.
                You can join the call 5 minutes before the scheduled time.
              </p>
            </div>
          )}

          {canJoinCall && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium mb-2">
                Your appointment is happening now!
              </p>
              <p className="text-green-700 text-sm">
                Click the button below to join the video consultation with your doctor.
              </p>
            </div>
          )}

          {/* Join Call Button */}
          {canJoinCall && (
            <button
              onClick={() => setInCall(true)}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition flex items-center justify-center text-lg font-medium"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Join Video Call
            </button>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Before joining:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure you have a stable internet connection</li>
              <li>• Test your camera and microphone</li>
              <li>• Find a quiet, well-lit space</li>
              <li>• Have any relevant medical information ready</li>
            </ul>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}