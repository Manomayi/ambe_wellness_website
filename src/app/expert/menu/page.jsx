'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function ExpertMenuPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    photoURL: '',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (!user) {
        router.push('/login');
      } else {
        setProfile({
          name: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
        });
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handlePhotoChange = async e => {
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
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  const menuSections = [
    {
      title: 'Account',
      items: [
        {
          label: 'Name',
          icon: UserIcon,
          route: '/expert/menu/name',
          value: profile.name,
        },
        {
          label: 'Email',
          icon: EnvelopeIcon,
          route: '/expert/menu/email',
          value: profile.email,
        },
        {
          label: 'Password',
          icon: LockClosedIcon,
          route: '/expert/menu/password',
        },
      ],
    },
    {
      title: 'Professional',
      items: [
        {
          label: 'Specialty',
          icon: Cog6ToothIcon,
          route: '/expert/menu/specialty',
        },
        {
          label: 'Verification',
          icon: ArrowRightOnRectangleIcon,
          route: '/expert/menu/verification',
        },
        {
          label: 'Feedback',
          icon: QuestionMarkCircleIcon,
          route: '/expert/menu/feedback',
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          label: 'Notifications',
          icon: Cog6ToothIcon,
          route: '/expert/notifications-settings',
        },
      ],
    },
    {
      title: 'Other',
      items: [
        {
          label: 'Logout',
          icon: ArrowRightOnRectangleIcon,
          action: handleLogout,
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      {/* Profile */}
      <div className="flex flex-col items-center space-y-4">
        <img
          src={profile.photoURL}
          alt={profile.name}
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

      {/* Menu Sections */}
      {menuSections.map((section, idx) => (
        <div key={idx}>
          <h3 className="text-sm uppercase font-semibold text-gray-600 mb-4">
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() =>
                    item.route ? router.push(item.route) : item.action()
                  }
                  className="
                    w-full
                    bg-white
                    shadow-md
                    rounded-xl
                    p-6
                    flex
                    items-center
                    justify-between
                    border-l-4
                    border-green-600
                    hover:shadow-lg
                    transition
                  "
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-600 p-3 rounded-full flex-shrink-0">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-left">
                        {item.label}
                      </p>
                      {item.value && (
                        <p className="text-gray-600 text-sm">{item.value}</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-green-600 p-2 rounded-full flex-shrink-0">
                    <ArrowRightIcon className="h-4 w-4 text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}