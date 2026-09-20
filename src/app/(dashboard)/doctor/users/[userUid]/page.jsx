// src/app/doctor/users/[userUid]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { 
  ChevronRightIcon, 
  DocumentTextIcon, 
  SparklesIcon, 
  UserIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';

export default function UserCompleteProfilePage() {
  const router = useRouter();
  const { userUid } = useParams();
  const searchParams = useSearchParams();
  const userName = searchParams.get('name');

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [doshaData, setDoshaData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!userUid) return;

      try {
        const hist = query(
          collection(db, 'users', userUid, 'appointments_history'),
          orderBy('time', 'desc')
        );
        const [snap, profileSnap, doshaSnap] = await Promise.all([
          getDocs(hist),
          getDoc(doc(db, 'users', userUid)),
          getDoc(doc(db, 'users', userUid, 'questionnaires', 'dosha_questionnaire')),
        ]);
        setAppointments(
          snap.docs.map(d => ({ id: d.id, ...d.data() }))
        );
        setProfile(profileSnap.exists() ? profileSnap.data() : null);
        setDoshaData(doshaSnap.exists() ? doshaSnap.data() : null);
      } catch (e) {
        console.error('Error loading history:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [userUid, router]);

  const fmt = ts => {
    const d = ts?.toDate?.();
    return d?.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  const resolvedName =
    userName ||
    profile?.name ||
    profile?.display_name ||
    (profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : '') ||
    'Patient Profile';

  let dosha = 'N/A';
  if (doshaData?.dosha_scores) {
    const scores = doshaData.dosha_scores;
    if (scores.primary) {
      dosha = `${scores.primary}`;
      if (scores.secondary) {
        dosha += ` / ${scores.secondary}`;
      }
      dosha = dosha.split(' / ').map(e => e ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : '').join(' / ');
    }
  }

  const genderAtBirth = profile?.genderAtBirth?.trim() || 'Not provided';

  return (
    <WebLayoutWrapper>
      <div className="space-y-6 pb-24">
        {/* Top Header */}
        <div className="flex items-center gap-4 pt-2">
          <AmbeBackButton onClick={() => router.push('/doctor/users')} />
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Patient Profile
          </h1>
        </div>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#FFD3AC] bg-black/40 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.photoURL || profile?.profile_image_url ? (
              <img
                src={profile.photoURL || profile.profile_image_url}
                alt={resolvedName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-bold text-[#FFD3AC]">
                {resolvedName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
              {resolvedName}
            </h2>
            {profile?.email && (
              <p className="text-sm text-neutral-400 truncate mt-0.5">
                {profile.email}
              </p>
            )}
          </div>
        </div>

        {/* Medical Summary */}
        <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-5 backdrop-blur-md shadow-xl space-y-4">
          <p className="text-xs font-semibold text-white/70 tracking-wider uppercase">
            Medical Summary
          </p>
          <div className="grid grid-cols-2 gap-4 divide-x divide-white/10 text-center">
            <div className="flex flex-col items-center">
              <SparklesIcon className="w-6 h-6 text-[#FFD3AC] mb-1.5" />
              <p className="text-xs text-white/60">Dosha</p>
              <p className="text-base font-bold text-white mt-1">
                {dosha}
              </p>
            </div>
            <div className="flex flex-col items-center pl-4">
              <UserIcon className="w-6 h-6 text-[#FFD3AC] mb-1.5" />
              <p className="text-xs text-white/60">Sex at Birth</p>
              <p className="text-base font-bold text-white mt-1">
                {genderAtBirth}
              </p>
            </div>
          </div>
        </div>

        {/* Health Questionnaire Banner Button */}
        <button
          onClick={() =>
            router.push(
              `/doctor/users/${userUid}/questionnaire?name=${encodeURIComponent(resolvedName)}`
            )
          }
          className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-2xl p-4 sm:p-5 flex items-center justify-between transition shadow-lg text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-black/15 flex items-center justify-center shrink-0">
              <DocumentTextIcon className="w-6 h-6 text-[#1E1E1E]" />
            </div>
            <div>
              <p className="font-bold text-base text-[#1E1E1E]">
                View Health Questionnaire
              </p>
              <p className="text-xs text-[#1E1E1E]/75 mt-0.5">
                Comprehensive health assessment & dosha profile
              </p>
            </div>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-[#1E1E1E] shrink-0 group-hover:translate-x-1 transition" />
        </button>

        {/* Consultation History */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-white/70 tracking-wider uppercase">
            Consultation History
          </p>
          {appointments.length === 0 ? (
            <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md">
              <p className="text-sm text-neutral-400">No appointment history found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(app => (
                <button
                  key={app.id}
                  onClick={() =>
                    router.push(
                      `/doctor/consultations/report/${app.id}` +
                      `?userUid=${app.user_id || userUid}` +
                      `&userName=${encodeURIComponent(resolvedName)}` +
                      `&doctorName=${encodeURIComponent(app.doctor_name || '')}`
                    )
                  }
                  className="w-full bg-[#2D2D30]/85 hover:bg-[#38383c] border border-white/10 rounded-2xl p-4 flex items-center justify-between transition text-left backdrop-blur-md shadow-md cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[#FFD3AC]/15 border border-[#FFD3AC]/25 flex items-center justify-center shrink-0">
                      <CalendarDaysIcon className="w-5 h-5 text-[#FFD3AC]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">
                        Dr. {app.doctor_name || 'Doctor'}
                      </p>
                      <p className="text-xs text-white/60 mt-0.5">
                        {fmt(app.time)}
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-neutral-400 group-hover:text-white transition" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </WebLayoutWrapper>
  );
}