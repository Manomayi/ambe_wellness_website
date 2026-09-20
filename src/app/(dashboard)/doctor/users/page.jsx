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
            if (error?.code === 'permission-denied') return;
            console.error('Error listening to patients collection:', error);
            setLoading(false);
          }
        );

        // 2. Listen to upcoming appointments to identify users with upcoming sessions
        const upcomingCol = collection(db, 'doctors', user.uid, 'appointments_upcoming');
        unsubUpcoming = onSnapshot(
          upcomingCol,
          (snapshot) => {
            const ids = new Set();
            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();
              const uId = data.user_id || data.userId;
              if (uId) ids.add(uId);
            });
            setUpcomingUserIds(ids);
          },
          (err) => {
            if (err?.code === 'permission-denied') return;
            console.error('Error listening to doctor upcoming appointments:', err);
          }
        );

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">
          Patients
        </h1>
        <p className="text-gray-400 text-sm mt-1 font-sans">
          View and manage all your matched patients
        </p>
      </div>

      {/* Search Bar & Filter Chips matching Flutter */}
      <div className="bg-[#1B1A18]/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-3.5 shadow-lg">
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#FFD3AC]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients..."
            className="w-full pl-11 pr-4 py-2.5 bg-[#2D2D30] border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] transition font-sans"
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition font-sans cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFD3AC] text-[#1E1E1E] shadow-sm'
                    : 'bg-[#2D2D30] text-gray-300 border border-white/10 hover:bg-[#3D3D42]'
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
        <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-12 text-center">
          <UserGroupIcon className="h-14 w-14 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white font-sans">
            {searchQuery
              ? 'No matching patients found'
              : selectedFilter === 'Upcoming'
              ? 'No patients with upcoming consultations'
              : selectedFilter === 'New'
              ? 'No new patients in the last 30 days'
              : 'No patients yet'}
          </h3>
          <p className="text-gray-400 text-sm mt-1 font-sans max-w-md mx-auto">
            {searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'When patients are matched or complete consultations with you, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                className="w-full bg-[#1B1A18]/80 border border-white/10 hover:border-[#FFD3AC]/40 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {patient.profile_picture ? (
                    <img
                      src={patient.profile_picture}
                      alt={patient.name || 'Patient'}
                      className="h-12 w-12 rounded-full object-cover border-2 border-[#FFD3AC] shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-[#2D2D30] border-2 border-[#FFD3AC] flex items-center justify-center text-[#FFD3AC] font-bold text-sm shrink-0">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-white truncate group-hover:text-[#FFD3AC] transition font-sans">
                        {patient.name || 'Unknown'}
                      </span>
                      {hasUpcoming && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-sans">
                          Upcoming
                        </span>
                      )}
                    </div>
                    {patient.email && (
                      <p className="text-xs text-gray-400 truncate mt-0.5 font-sans">
                        {patient.email}
                      </p>
                    )}
                  </div>
                </div>

                <ChevronRightIcon className="h-5 w-5 text-[#FFD3AC] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}