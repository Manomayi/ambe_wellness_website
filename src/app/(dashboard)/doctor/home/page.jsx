'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { 
  collection, 
  doc, 
  onSnapshot,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function DoctorHomePage() {
  const router = useRouter();
  const { user, profile, isVerifiedDoctor } = useAuth();

  const [stats, setStats] = useState({
    upcomingCount: 0,
    patientCount: 0,
    reportCount: 0,
    unreadMessagesCount: 0,
  });
  const [reportsToFinish, setReportsToFinish] = useState([]);
  const [loading, setLoading] = useState(true);


  // Current week generator (Monday to Sunday) matching Flutter DoctorCalendarStrip
  const getCalendarDays = () => {
    const days = [];
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - diffToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const calendarDays = getCalendarDays();

  useEffect(() => {
    if (!user) return;

    // Upcoming appointments listener
    const upcomingCol = collection(db, 'doctors', user.uid, 'appointments_upcoming');
    const unsubUpcoming = onSnapshot(
      upcomingCol,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          const timeA = a.time?.toDate ? a.time.toDate().getTime() : (a.time ? new Date(a.time).getTime() : 0);
          const timeB = b.time?.toDate ? b.time.toDate().getTime() : (b.time ? new Date(b.time).getTime() : 0);
          return timeA - timeB;
        });
        const now = new Date();
        const startThreshold = new Date(now.getTime() - 65 * 60 * 1000);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Filter for TODAY'S active/upcoming appointments only
        const todayUpcoming = list.filter((apt) => {
          const aptDate = apt.time?.toDate ? apt.time.toDate() : (apt.time ? new Date(apt.time) : null);
          if (!aptDate) return false;
          return aptDate >= startThreshold && aptDate <= endOfToday;
        });

        setStats((prev) => ({ ...prev, upcomingCount: todayUpcoming.length }));
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to doctor upcoming appointments:', err);
      }
    );

    // Reports to finish listener
    const reportsCol = collection(db, 'doctors', user.uid, 'appointments_reports_to_finish');
    const unsubReports = onSnapshot(
      reportsCol,
      (snapshot) => {
        const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReportsToFinish(reports);
        setStats((prev) => ({ ...prev, reportCount: reports.length }));
        setLoading(false);
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to doctor reports to finish:', err);
        setLoading(false);
      }
    );

    // Patients real-time listener
    const patientsCol = collection(db, 'doctors', user.uid, 'users');
    const unsubPatients = onSnapshot(
      patientsCol,
      (snapshot) => {
        setStats((prev) => ({ ...prev, patientCount: snapshot.size }));
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to doctor patients:', err);
      }
    );

    // Messages real-time listener for unread count
    const chatsCol = collection(db, 'doctors', user.uid, 'chats');
    const unsubChats = onSnapshot(
      chatsCol,
      (snapshot) => {
        let unreadCount = 0;
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const readByDoctor = data.last_message_read_by_doctor ?? true;
          const senderUid = data.last_message_sender_uid;
          if (readByDoctor === false && senderUid !== user.uid) {
            unreadCount++;
          }
        });
        setStats((prev) => ({ ...prev, unreadMessagesCount: unreadCount }));
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to doctor chats:', err);
      }
    );

    return () => {
      unsubUpcoming();
      unsubReports();
      unsubPatients();
      unsubChats();
    };
  }, [user]);

  const lastName = profile?.last_name || user?.displayName?.split(' ').pop() || 'Doctor';
  const photoUrl = profile?.profile_picture || user?.photoURL;
  const isScheduleSet = profile?.is_schedule_set ?? false;


  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };


  return (
    <ProtectedRoute userType="doctor">
      <div className="space-y-6">
        {/* Header Section matching Flutter DoctorHomePage (Image 1) */}
        <div className="bg-[#2D2D30] rounded-b-[32px] md:rounded-[28px] px-6 pt-5 pb-6 shadow-xl border-b border-white/5 md:border md:border-white/10">
          {/* Top Bar: Logo on left, Notification Bell on right */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/doctor/home" className="flex items-center">
              <Image
                src="/images/logos/ambe_logo.png"
                alt="AMBÉ"
                width={100}
                height={32}
                className="w-[85px] sm:w-[95px] h-auto object-contain cursor-pointer"
                priority
              />
            </Link>

            <Link
              href="/doctor/notifications"
              className="text-[#FFD3AC] hover:opacity-80 transition p-1 cursor-pointer"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </Link>
          </div>

          {/* Doctor Profile Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 sm:gap-4">
              {/* Doctor Avatar with peach circle border */}
              <div className="w-16 h-16 sm:w-[68px] sm:h-[68px] rounded-full border-2 border-[#FFD3AC] overflow-hidden bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 shadow-md">
                {photoUrl ? (
                  <img src={photoUrl} alt={lastName} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 sm:w-9 sm:h-9 text-[#FFD3AC]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>

              {/* Greeting Text */}
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl text-white font-normal tracking-tight">
                  Hello, Dr. {lastName} !
                </h1>
                <p className="text-gray-400 font-sans text-xs sm:text-sm mt-0.5">
                  Ready to help your patients?
                </p>
              </div>
            </div>

            {/* Verified status badge on the right - NO checkmark */}
            <div>
              {isVerifiedDoctor ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#C8996A] text-[#FFD3AC] text-xs font-sans font-medium tracking-wide">
                  Verified
                </span>
              ) : (
                <Link
                  href="/doctor/menu/verification"
                  className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-amber-500/50 text-amber-300 text-xs font-sans font-medium tracking-wide hover:bg-amber-500/10 transition"
                >
                  Pending
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Inner Content Container */}
        <div className="px-4 sm:px-6 space-y-6 pt-1">
          {/* Calendar Strip matching Flutter DoctorCalendarStrip (7 floating pills, no outer card) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 select-none">
            {calendarDays.map((d, i) => {
              const today = isToday(d);
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const monthName = d.toLocaleDateString('en-US', { month: 'short' });
              const dayNum = d.getDate();

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center py-2.5 px-0.5 rounded-[24px] sm:rounded-[26px] transition-all ${
                    today
                      ? 'bg-[#FFD3AC] text-[#1E1E1E] shadow-md font-bold'
                      : 'bg-[#2D2D30]/80 text-white'
                  }`}
                >
                  <span className={`text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold ${today ? 'text-[#1E1E1E]' : 'text-gray-400'}`}>
                    {dayName}
                  </span>
                  <span className={`text-base sm:text-lg font-bold my-0.5 ${today ? 'text-[#1E1E1E]' : 'text-white'}`}>
                    {dayNum}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] uppercase font-semibold tracking-wide ${today ? 'text-[#1E1E1E]' : 'text-gray-400'}`}>
                    {monthName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Things To Do Section matching Flutter DoctorThingsToDoList */}
          {(!isVerifiedDoctor || !isScheduleSet || reportsToFinish.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-xl font-sans font-semibold text-white tracking-tight">
                Things To Do
              </h2>

              {/* Waiting to be approved prompt */}
              {!isVerifiedDoctor && (
                <Link
                  href="/doctor/menu/verification"
                  className="block bg-[#FFD3AC] text-[#1E1E1E] rounded-[22px] p-5 hover:bg-[#ffe3c9] transition shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-sans text-[#1E1E1E]">
                        Waiting to be approved
                      </h3>
                      <p className="text-sm text-[#1E1E1E]/80 mt-0.5 font-sans">
                        Your account is currently under review
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[#1E1E1E] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Set availability prompt */}
              {!isScheduleSet && (
                <Link
                  href="/doctor/schedule"
                  className="block bg-[#FFD3AC] text-[#1E1E1E] rounded-[22px] p-5 hover:bg-[#ffe3c9] transition shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-sans text-[#1E1E1E]">
                        Set your availability
                      </h3>
                      <p className="text-sm text-[#1E1E1E]/80 mt-0.5 font-sans">
                        Set your schedule to start accepting consultations
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[#1E1E1E] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Reports to finish prompt */}
              {reportsToFinish.length > 0 && (
                <Link
                  href="/doctor/consultations"
                  className="block bg-[#FFD3AC] text-[#1E1E1E] rounded-[22px] p-5 hover:bg-[#ffe3c9] transition shadow-md group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold font-sans text-[#1E1E1E]">
                        Reports to finish
                      </h3>
                      <p className="text-sm text-[#1E1E1E]/80 mt-0.5 font-sans">
                        You have {reportsToFinish.length} {reportsToFinish.length > 1 ? 'reports' : 'report'} to finish
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[#1E1E1E] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Quick Stats Section matching Flutter DoctorQuickStatsCard */}
          <div className="space-y-3">
            <h2 className="text-xl font-sans font-semibold text-white tracking-tight">
              Quick Stats
            </h2>

            <div className="bg-white text-[#1E1E1E] rounded-[24px] p-5 shadow-lg">
              <h3 className="text-base font-bold font-sans text-[#1E1E1E] mb-4">
                Today's Overview
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-2xl font-bold font-sans mt-2">{stats.upcomingCount}</span>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">Upcoming</span>
                </div>

                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-2xl font-bold font-sans mt-2">{stats.patientCount ?? 0}</span>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">Patients</span>
                </div>

                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-2xl font-bold font-sans mt-2">{stats.unreadMessagesCount ?? 0}</span>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">Messages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}