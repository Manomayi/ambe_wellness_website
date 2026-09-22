"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import UserMenuItem, { UserMenuSection } from "@/components/common/UserMenuItem";
import { useAuth } from "@/contexts/AuthContext";

export default function UserMenuPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    photoURL: "",
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setProfile({
          name: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
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
    const picRef = storageRef(storage, `images/${user.uid}/profile_picture.png`);
    try {
      await deleteObject(picRef).catch(() => {});
      await uploadBytes(picRef, file);
      const url = await getDownloadURL(picRef);
      await updateProfile(user, { photoURL: url });
      setProfile((p) => ({ ...p, photoURL: url }));
    } catch (err) {
      console.error("Photo upload error:", err);
      alert("Failed to update photo");
    }
  };

  const handleLogout = async () => {
    try {
      router.push("/login");
      if (signOut) {
        await signOut();
      } else {
        await auth.signOut();
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 pb-6">
      {/* Title */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-white text-2xl font-bold tracking-wide font-sans">
          Menu
        </h1>
      </div>

      {/* Profile Header (matching Flutter UserProfileHeader) */}
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className="relative mb-3">
          <div
            onClick={handlePhotoClick}
            className="w-20 h-20 rounded-full bg-[#2D2D30] border-2 border-[#FFD3AC] overflow-hidden flex items-center justify-center text-white cursor-pointer shadow-md group"
          >
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold font-sans">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
              <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePhotoClick}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#FFD3AC] text-[#1E1E1E] flex items-center justify-center shadow-sm cursor-pointer"
            aria-label="Change photo"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <h2 className="text-white text-xl font-bold font-sans">
          {profile.name || "My Account"}
        </h2>
        <p className="text-gray-400 text-xs sm:text-sm font-sans mt-0.5">
          {profile.email}
        </p>
      </div>

      {/* Account Section */}
      <UserMenuSection title="Account">
        <UserMenuItem
          title="Name"
          href="/user/menu/name"
          trailingText={profile.name}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Email"
          href="/user/menu/email"
          trailingText={profile.email}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
        />
        <UserMenuItem
          title="Password"
          href="/user/menu/password"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* My Activity Section */}
      <UserMenuSection title="My Activity">
        <UserMenuItem
          title="Membership"
          href="/user/membership"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 002.25 19.5z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Questionnaire Result"
          href="/user/menu/questionnaire/results"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Consultation History"
          href="/user/consult/history"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Wishlist"
          href="/user/wishlist"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Purchase History"
          href="/user/menu/purchase_history"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Refund"
          href="/user/menu/refunds"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.75H4.5A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5z" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* Connect & Support Section — matching Flutter's 4 items */}
      <UserMenuSection title="Connect & Support">
        <UserMenuItem
          title="Support"
          href="/user/menu/support"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Notifications"
          href="/user/notifications-settings"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          }
        />
        <UserMenuItem
          title="Request a New Doctor"
          href="/user/request-doctor"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
            </svg>
          }
        />
        <UserMenuItem
          title="Refer a Friend"
          href="/user/referral"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          }
        />
      </UserMenuSection>

      {/* Danger Zone — matching Flutter */}
      <UserMenuSection title="Danger Zone">
        <UserMenuItem
          title="Sign Out"
          onClick={handleLogout}
          danger
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
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

      {/* Legal & Disclosures link — matching Flutter */}
      <div className="pt-1 pb-6 text-center">
        <Link
          href="/terms"
          className="text-sm font-medium text-[#FFD3AC] hover:text-[#ffe0c4] underline decoration-[#FFD3AC] transition font-sans"
        >
          Legal & Disclosures
        </Link>
      </div>
    </div>
  );
}
