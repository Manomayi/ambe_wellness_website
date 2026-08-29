'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

export default function DoctorUserProfilesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [upcomingUserIds, setUpcomingUserIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All'); // 'All', 'Upcoming', 'New'

  useEffect(() => {
    let unsubUsers = null;
    let unsubUpcoming = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // 1. Listen to the doctor's patients subcollection (doctors/{uid}/users)
        const usersCol = collection(db, 'doctors', user.uid, 'users');
        unsubUsers = onSnapshot(
          usersCol,
          (snapshot) => {
            const list = snapshot.docs.map((d) => ({
              uid: d.id,
              ...d.data(),
            }));

            // Sort by matched_at descending (or last_consultation or name)
            list.sort((a, b) => {
              const timeA = a.matched_at?.toDate
                ? a.matched_at.toDate().getTime()
                : a.matched_at
                ? new Date(a.matched_at).getTime()
                : 0;
              const timeB = b.matched_at?.toDate
                ? b.matched_at.toDate().getTime()
                : b.matched_at
                ? new Date(b.matched_at).getTime()
                : 0;
              return timeB - timeA;
            });

            setPatients(list);
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to patients collection:', error);
            setLoading(false);
          }
        );

        // 2. Listen to upcoming appointments to identify users with upcoming sessions
        const upcomingCol = collection(db, 'doctors', user.uid, 'appointments_upcoming');
        unsubUpcoming = onSnapshot(upcomingCol, (snapshot) => {
          const ids = new Set();
          snapshot.docs.forEach((docSnap) => {
            const data = docSnap.data();
            const uId = data.user_id || data.userId;
            if (uId) ids.add(uId);
          });
          setUpcomingUserIds(ids);
        });

        // 3. Self-healing backfill from appointments_history & appointments_upcoming (matching mobile app)
        syncMissingPatients(user.uid);
      } catch (e) {
        console.error('Error initializing doctor patients page:', e);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubUsers) unsubUsers();
      if (unsubUpcoming) unsubUpcoming();
    };
  }, [router]);

  // Self-healing synchronization matching Flutter mobile app
  async function syncMissingPatients(doctorUid) {
    try {
      const [existingUsersSnap, historySnap, upcomingSnap] = await Promise.all([
        getDocs(collection(db, 'doctors', doctorUid, 'users')),
        getDocs(query(collection(db, 'doctors', doctorUid, 'appointments_history'), limit(50))),
        getDocs(collection(db, 'doctors', doctorUid, 'appointments_upcoming')),
      ]);

      const existingIds = new Set();
      const needsUpdate = new Set();

      existingUsersSnap.docs.forEach((d) => {
        existingIds.add(d.id);
        const name = d.data().name || '';
        if (!name || name === 'Unknown') {
          needsUpdate.add(d.id);
        }
      });

      historySnap.docs.forEach((d) => {
        const uId = d.data().user_id || d.data().userId;
        if (uId && !existingIds.has(uId)) {
          needsUpdate.add(uId);
          existingIds.add(uId);
        }
      });

      upcomingSnap.docs.forEach((d) => {
        const uId = d.data().user_id || d.data().userId;
        if (uId && !existingIds.has(uId)) {
          needsUpdate.add(uId);
          existingIds.add(uId);
        }
      });

      if (needsUpdate.size === 0) return;

      for (const userId of needsUpdate) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', userId));
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() || {};
            let name =
              userData.name ||
              userData.display_name ||
              userData.displayName ||
              '';
            if (!name) {
              const firstName = userData.first_name || userData.firstName || '';
              const lastName = userData.last_name || userData.lastName || '';
              if (firstName || lastName) {
                name = `${firstName} ${lastName}`.trim();
              } else {
                name = 'Unknown';
              }
            }

            await setDoc(
              doc(db, 'doctors', doctorUid, 'users', userId),
              {
                name,
                email: userData.email || '',
                profile_picture: userData.profile_picture || userData.photoURL || '',
                phone_number: userData.phone_number || '',
                matched_at: serverTimestamp(),
                last_consultation: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (err) {
          console.warn(`Failed to sync patient ${userId}:`, err);
        }
      }
    } catch (e) {
      console.warn('Sync missing patients error:', e);
    }
  }

  // Filter and search logic
  const filteredPatients = patients.filter((patient) => {
    // 1. Text search
    const queryStr = searchQuery.toLowerCase().trim();
    if (queryStr) {
      const name = (patient.name || '').toLowerCase();
      const email = (patient.email || '').toLowerCase();
      if (!name.includes(queryStr) && !email.includes(queryStr)) {
        return false;
      }
    }

    // 2. Category filter
    if (selectedFilter === 'Upcoming') {
      return upcomingUserIds.has(patient.uid);
    } else if (selectedFilter === 'New') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const matchedDate = patient.matched_at?.toDate
        ? patient.matched_at.toDate()
        : patient.matched_at
        ? new Date(patient.matched_at)
        : null;
      if (!matchedDate) return false;
      return matchedDate >= cutoff;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">Patients</h1>
        <p className="text-[#6B6862] text-sm mt-1">
          View and manage all your matched patients
        </p>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E7E2D9] p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8C827A]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-lg text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2">
          {['All', 'Upcoming', 'New'].map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition ${
                  isSelected
                    ? 'bg-[#FFD3AC] text-[#1A1A1A] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#6B6862] border border-[#E7E2D9] hover:bg-[#F4F1EA]'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E7E2D9] p-12 text-center">
          <UserGroupIcon className="h-12 w-12 text-[#C8996A]/60 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#1A1A1A]">
            {searchQuery
              ? 'No matching patients found'
              : selectedFilter === 'Upcoming'
              ? 'No patients with upcoming consultations'
              : selectedFilter === 'New'
              ? 'No new patients in the last 30 days'
              : 'No patients yet'}
          </h3>
          <p className="text-[#6B6862] text-sm mt-1">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'When patients are matched or complete consultations with you, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatients.map((patient) => {
            const initials = (patient.name || 'U')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const hasUpcoming = upcomingUserIds.has(patient.uid);

            return (
              <button
                key={patient.uid}
                onClick={() =>
                  router.push(
                    `/doctor/users/${patient.uid}?name=${encodeURIComponent(
                      patient.name || 'Patient'
                    )}`
                  )
                }
                className="w-full bg-white border border-[#E7E2D9] hover:border-[#C8996A] shadow-sm rounded-xl p-4 flex items-center justify-between text-left hover:shadow-md transition group"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  {patient.profile_picture ? (
                    <img
                      src={patient.profile_picture}
                      alt={patient.name || 'Patient'}
                      className="h-13 w-13 rounded-full object-cover border-2 border-[#FFD3AC] shrink-0"
                    />
                  ) : (
                    <div className="h-13 w-13 rounded-full bg-[#FAF8F5] border-2 border-[#FFD3AC] flex items-center justify-center text-[#C8996A] font-bold text-base shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-[#1A1A1A] truncate group-hover:text-[#C8996A] transition">
                        {patient.name || 'Unknown'}
                      </span>
                      {hasUpcoming && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Upcoming
                        </span>
                      )}
                    </div>
                    {patient.email && (
                      <p className="text-sm text-[#6B6862] truncate mt-0.5">
                        {patient.email}
                      </p>
                    )}
                  </div>
                </div>

                <ChevronRightIcon className="h-5 w-5 text-[#8C827A] group-hover:text-[#C8996A] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}