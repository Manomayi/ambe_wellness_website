"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
    if (user && profile) {
      fetchDashboardData();
    }
  }, [user, profile]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const usersQuery = collection(db, `doctors/${user.uid}/users`);
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;

      // Fetch upcoming consultations
      const now = Timestamp.now();
      const upcomingQuery = query(
        collection(db, `doctors/${user.uid}/appointments_upcoming`),
        where('time', '>=', now),
        orderBy('time', 'asc'),
        limit(5)
      );
      const upcomingSnapshot = await getDocs(upcomingQuery);
      const upcomingList = upcomingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch completed consultations
      const completedQuery = collection(db, `doctors/${user.uid}/appointments_completed`);
      const completedSnapshot = await getDocs(completedQuery);
      const completedCount = completedSnapshot.size;

      // Get pending reports count from profile
      const pendingReports = profile?.pending?.finish_report || 0;

      setStats({
        totalUsers,
        upcomingConsultations: upcomingList.length,
        pendingReports,
        completedConsultations: completedCount,
      });
      setUpcomingAppointments(upcomingList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatAppointmentTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <ProtectedRoute userType="doctor">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, Dr. {profile?.last_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your practice today
          </p>
        </div>

        {/* Verification Warning */}
        {!isVerifiedDoctor && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Verification Pending</h3>
              <p className="text-yellow-700 text-sm mt-1">
                Your account is under review. You'll be able to see users once verified.
              </p>
              <button 
                onClick={() => router.push('/doctor/menu/verification')}
                className="text-yellow-800 underline text-sm mt-2"
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
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.totalUsers}
                </p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Upcoming Consultations</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.upcomingConsultations}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.pendingReports}
                </p>
              </div>
              <DocumentTextIcon className="h-10 w-10 text-yellow-500" />
            </div>
            {stats.pendingReports > 0 && (
              <button 
                onClick={() => router.push('/doctor/consultations')}
                className="text-sm text-blue-600 mt-2 hover:underline"
              >
                Complete reports →
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Consultations</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.completedConsultations}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/doctor/consultations')}
              className="bg-white border border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors text-left"
            >
              <CalendarIcon className="h-6 w-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-800">View Consultations</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage upcoming and past consultations
              </p>
            </button>

            <button
              onClick={() => router.push('/doctor/messages')}
              className="bg-white border border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors text-left"
            >
              <ClockIcon className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Messages</h3>
              <p className="text-sm text-gray-600 mt-1">
                Chat with your users
              </p>
            </button>

            <button
              onClick={() => router.push('/doctor/users')}
              className="bg-white border border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors text-left"
            >
              <UserGroupIcon className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-800">My Users</h3>
              <p className="text-sm text-gray-600 mt-1">
                View all your users
              </p>
            </button>
          </div>
        </div>

        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upcoming Appointments
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {upcomingAppointments.map((appointment, index) => (
                <div 
                  key={appointment.id}
                  className={`p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                    index !== upcomingAppointments.length - 1 ? 'border-b' : ''
                  }`}
                  onClick={() => router.push(`/doctor/consultations`)}
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {appointment.user_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatAppointmentTime(appointment.time)}
                    </p>
                  </div>
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Setup Reminder */}
        {!profile?.is_schedule_set && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800">Set Your Availability</h3>
            <p className="text-blue-700 text-sm mt-1">
              Set up your weekly schedule to allow users to book consultations.
            </p>
            <button 
              onClick={() => router.push('/doctor/schedule')}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Set Schedule
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}