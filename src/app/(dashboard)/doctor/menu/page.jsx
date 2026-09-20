'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import UserMenuItem, { UserMenuSection } from '@/components/common/UserMenuItem';
import AmbeButton from '@/components/common/AmbeButton';
import { useAuth } from '@/contexts/AuthContext';

export default function DoctorMenuPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    photoURL: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
      } else {
        let photo = user.photoURL || null;
        let name = user.displayName || '';
        try {
          const docRef = doc(db, 'doctors', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.profile_picture) photo = data.profile_picture;
            if (data.first_name || data.last_name) {
              name = `Dr. ${data.first_name || ''} ${data.last_name || ''}`.trim();
            }
          }
        } catch (e) {
          console.error('Error fetching doctor doc:', e);
        }

        setProfile({
          name: name || user.displayName || 'Dr. Doctor',
          email: user.email || '',
          photoURL: photo || null,
        });
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = async (e) => {
    const user = auth.currentUser;
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const storage = getStorage();
    const picRef = storageRef(
      storage,
      `images/${user.uid}/profile_picture.png`
    );
    try {
      await deleteObject(picRef).catch(() => {});
      await uploadBytes(picRef, file);
      const url = await getDownloadURL(picRef);
      await updateProfile(user, { photoURL: url });
      await setDoc(doc(db, 'doctors', user.uid), { profile_picture: url }, { merge: true });
      setProfile((p) => ({ ...p, photoURL: url }));
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Failed to update photo');
    }
  };

  const handleLogout = async () => {
    try {
      router.push('/login');
      if (signOut) {
        await signOut();
      } else {
        await auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg mx-auto pb-12">
      {/* Profile Header matching Flutter UserProfileHeader */}
      <div className="flex flex-col items-center pt-2">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-2 border-[#FFD3AC] overflow-hidden bg-[#2D2D30] flex items-center justify-center shadow-lg">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-heading text-[#FFD3AC]">
                {profile.name.replace('Dr. ', '').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={handlePhotoClick}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FFD3AC] text-[#1E1E1E] flex items-center justify-center shadow-md hover:scale-105 transition cursor-pointer"
            aria-label="Change photo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <h2 className="mt-3 text-xl font-semibold text-white font-sans">
          {profile.name}
        </h2>
        <p className="text-xs text-gray-400 font-sans mt-0.5">
          {profile.email}
        </p>
      </div>

      {/* Account Section */}
      <UserMenuSection title="Account">
        <UserMenuItem
          title="Name"
          trailingText={profile.name}
          href="/doctor/menu/name"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Email"
          trailingText={profile.email}
          href="/doctor/menu/email"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Password"
          href="/doctor/menu/password"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* Professional Section */}
      <UserMenuSection title="Professional">
        <UserMenuItem
          title="Specialty"
          href="/doctor/menu/specialty"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <UserMenuItem
          title="Verification"
          href="/doctor/menu/verification"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Professional Profile"
          href="/doctor/menu/professional-profile"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* My Activity Section */}
      <UserMenuSection title="My Activity">
        <UserMenuItem
          title="Consultation History"
          href="/doctor/consultations/history"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Patient Reviews"
          href="/doctor/menu/feedback"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Earnings"
          href="/doctor/earnings"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Schedule"
          href="/doctor/schedule"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* Connect & Support Section */}
      <UserMenuSection title="Connect & Support">
        <UserMenuItem
          title="Support"
          href="/doctor/menu/support"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Notifications"
          href="/doctor/notifications-settings"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* Danger Zone Section */}
      <UserMenuSection title="Danger Zone">
        <UserMenuItem
          title="Sign Out"
          onClick={handleLogout}
          danger
          icon={
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        />
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => router.push('/user/delete-account')}
            className="text-sm font-medium text-red-300 hover:text-red-200 underline decoration-red-300 transition cursor-pointer font-sans"
          >
            Delete Account
          </button>
        </div>
      </UserMenuSection>
    </div>
  );
}