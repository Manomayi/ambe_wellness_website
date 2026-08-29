"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { 
  collection, 
  getDocs, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, profile, isVerifiedDoctor } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    upcomingConsultations: 0,
    pendingReports: 0,
    completedConsultations: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to upcoming appointments
    const upcomingCol = collection(db, 'doctors', user.uid, 'appointments_upcoming');
    const unsubscribeUpcoming = onSnapshot(
      upcomingCol,
      (snapshot) => {
        const upcomingList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        upcomingList.sort((a, b) => {
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
        setUpcomingAppointments(upcomingList.slice(0, 5));
        setStats((prev) => ({
          ...prev,
          upcomingConsultations: upcomingList.length,
        }));
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
        setStats((prev) => ({
          ...prev,
          pendingReports: snapshot.size,
        }));
      },
      (error) => {
        console.error('Error listening to reports to finish:', error);
      }
    );

    // Fetch total users and completed consultations
    const fetchCounts = async () => {
      try {
        const [usersSnapshot, completedSnapshot] = await Promise.all([
          getDocs(collection(db, 'doctors', user.uid, 'users')),
          getDocs(collection(db, 'doctors', user.uid, 'appointments_history')),
        ]);
        setStats((prev) => ({
          ...prev,
          totalUsers: usersSnapshot.size,
          completedConsultations: completedSnapshot.size,
        }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
        setLoading(false);
      }
    };

    fetchCounts();

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
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  return (
    <ProtectedRoute userType="doctor">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">
            Welcome back, Dr. {profile?.last_name}
          </h1>
          <p className="text-[#6B6862] mt-1">
            Here's an overview of your practice today
          </p>
        </div>

        {/* Verification Warning */}
        {!isVerifiedDoctor && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Verification Pending</h3>
              <p className="text-amber-700 text-sm mt-1">
                Your account is under review. You'll be able to see patients once verified.
              </p>
              <button 
                onClick={() => router.push('/doctor/menu/verification')}
                className="text-amber-800 underline text-sm mt-2"
              >
                Check verification status
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B6862] text-sm">Total Patients</p>
                <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-[#C8996A]" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B6862] text-sm">Upcoming Consultations</p>
                <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
                  {stats.upcomingConsultations}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-[#C8996A]" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B6862] text-sm">Pending Reports</p>
                <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
                  {stats.pendingReports}
                </p>
              </div>
              <DocumentTextIcon className="h-10 w-10 text-[#C8996A]" />
            </div>
            {stats.pendingReports > 0 && (
              <button 
                onClick={() => router.push('/doctor/consultations')}
                className="text-sm text-[#C8996A] mt-2 hover:underline"
              >
                Complete reports →
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#6B6862] text-sm">Completed Consultations</p>
                <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
                  {stats.completedConsultations}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-[#C8996A]" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/doctor/consultations')}
              className="bg-white border border-[#E7E2D9] rounded-lg p-4 hover:border-[#C8996A] transition-colors text-left"
            >
              <CalendarIcon className="h-6 w-6 text-[#C8996A] mb-2" />
              <h3 className="font-semibold text-[#1A1A1A]">View Consultations</h3>
              <p className="text-sm text-[#6B6862] mt-1">
                Manage upcoming and past consultations
              </p>
            </button>

            <button
              onClick={() => router.push('/doctor/messages')}
              className="bg-white border border-[#E7E2D9] rounded-lg p-4 hover:border-[#C8996A] transition-colors text-left"
            >
              <ClockIcon className="h-6 w-6 text-[#C8996A] mb-2" />
              <h3 className="font-semibold text-[#1A1A1A]">Messages</h3>
              <p className="text-sm text-[#6B6862] mt-1">
                Chat with your patients
              </p>
            </button>

            <button
              onClick={() => router.push('/doctor/users')}
              className="bg-white border border-[#E7E2D9] rounded-lg p-4 hover:border-[#C8996A] transition-colors text-left"
            >
              <UserGroupIcon className="h-6 w-6 text-[#C8996A] mb-2" />
              <h3 className="font-semibold text-[#1A1A1A]">My Patient</h3>
              <p className="text-sm text-[#6B6862] mt-1">
                View all your patients
              </p>
            </button>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
              Upcoming Appointments
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {upcomingAppointments.map((appointment, index) => (
                <div 
                  key={appointment.id}
                  className={`p-4 flex items-center justify-between hover:bg-[#FAF8F5] cursor-pointer ${
                    index !== upcomingAppointments.length - 1 ? 'border-b' : ''
                  }`}
                  onClick={() => router.push(`/doctor/consultations`)}
                >
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">
                      {appointment.user_name}
                    </p>
                    <p className="text-sm text-[#6B6862]">
                      {formatAppointmentTime(appointment.time)}
                    </p>
                  </div>
                  <ClockIcon className="h-5 w-5 text-[#8C827A]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Setup Reminder */}
        {!profile?.is_schedule_set && (
          <div className="bg-[#F4F1EA] border border-[#E7E2D9] rounded-lg p-4">
            <h3 className="font-semibold text-[#1A1A1A]">Set Your Availability</h3>
            <p className="text-[#6B6862] text-sm mt-1">
              Set up your weekly schedule to allow patients to book consultations.
            </p>
            <button 
              onClick={() => router.push('/doctor/schedule')}
              className="mt-3 bg-[#FFD3AC] text-[#1A1A1A] hover:text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition"
            >
              Set Schedule
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}