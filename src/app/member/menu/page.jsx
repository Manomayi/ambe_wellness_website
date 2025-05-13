'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function MemberMenuPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', photoURL: '' });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setProfile({
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || ''
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
    const file = e.target.files?.[0]; if (!file) return;
    const storage = getStorage();
    const picRef = storageRef(storage, `images/${user.uid}/profile_picture.png`);
    try {
      await deleteObject(picRef).catch(() => {});
      await uploadBytes(picRef, file);
      const url = await getDownloadURL(picRef);
      await updateProfile(user, { photoURL: url });
      setProfile(p => ({ ...p, photoURL: url }));
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Failed to update photo');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  const menuSections = [
    {
      title: 'Account',
      items: [
        { label: 'Name', icon: UserIcon, route: '/member/menu/name', value: profile.name },
        { label: 'Email', icon: EnvelopeIcon, route: '/member/menu/email', value: profile.email },
        { label: 'Password', icon: LockClosedIcon, route: '/member/menu/password' }
      ]
    },
    {
      title: 'Actions',
      items: [
        { label: 'Questionnaire Results', icon: ClipboardDocumentCheckIcon, route: '/member/menu/questionnaire/results' },
        { label: 'Consultation History', icon: CalendarIcon, route: '/member/consult/history' },
        { label: 'Purchase History', icon: CreditCardIcon, route: '/member/menu/purchase_history' }
      ]
    },
    {
      title: 'Settings',
      items: [
        { label: 'Notifications', icon: Cog6ToothIcon, route: '/member/notifications-settings' }
      ]
    },
    {
      title: 'Support',
      items: [
        { label: 'Help & Support', icon: QuestionMarkCircleIcon, route: '/member/menu/support' }
      ]
    },
    {
      title: 'Other',
      items: [
        { label: 'Logout', icon: ArrowRightOnRectangleIcon, action: handleLogout }
      ]
    }
  ];

  return (
    <div className="max-w-lg mx-auto p-6 space-y-8">
      {/* Profile Section */}
      <div className="flex flex-col items-center space-y-4">
        <img
          src={profile.photoURL}
          alt="Profile"
          className="h-28 w-28 rounded-full object-cover"
        />
        <button
          onClick={handlePhotoClick}
          className="inline-flex items-center space-x-2 text-green-600 hover:underline"
        >
          <PencilIcon className="h-5 w-5" />
          <span>Change Photo</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Menu Sections Vertical */}
      {menuSections.map((section, idx) => (
        <div key={idx}>
          <h3 className="text-sm uppercase font-semibold text-gray-600 mb-4">{section.title}</h3>
          <div className="bg-white shadow rounded-lg">
            {section.items.map((item, i) => (
              <button
                key={i}
                onClick={item.route ? () => router.push(item.route) : item.action}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-5 w-5 text-gray-600" />
                  <div className="text-left">
                    <p className="text-gray-800">{item.label}</p>
                    {item.value && <p className="text-gray-500 text-sm">{item.value}</p>}
                  </div>
                </div>
                <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
