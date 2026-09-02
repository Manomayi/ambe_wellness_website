// src/app/user/menu/page.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
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
  ClipboardDocumentCheckIcon,
  CalendarIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilIcon,
  ArrowRightIcon,
  TrashIcon,
  UserGroupIcon,
  UserPlusIcon,
  ArrowPathRoundedSquareIcon,
  ReceiptRefundIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export default function UserMenuPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    photoURL: '',
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
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
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-[#C8996A] border-t-transparent" />
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
          route: '/user/menu/name',
          value: profile.name,
        },
        {
          label: 'Email',
          icon: EnvelopeIcon,
          route: '/user/menu/email',
          value: profile.email,
        },
        {
          label: 'Password',
          icon: LockClosedIcon,
          route: '/user/menu/password',
        },
      ],
    },
    {
      title: 'My Activity',
      items: [
        {
          label: 'Questionnaire Results',
          icon: ClipboardDocumentCheckIcon,
          route: '/user/menu/questionnaire/results',
        },
        {
          label: 'Consultation History',
          icon: CalendarIcon,
          route: '/user/consult/history',
        },
        {
          label: 'Purchase History',
          icon: CreditCardIcon,
          route: '/user/menu/purchase_history',
        },
        {
          label: 'Refunds',
          icon: ReceiptRefundIcon,
          route: '/user/menu/refunds',
        },
        {
          label: 'Subscription',
          icon: ArrowPathRoundedSquareIcon,
          route: '/user/membership',
        },
      ],
    },
    {
      title: 'Connect & Support',
      items: [
        {
          label: 'Support',
          icon: QuestionMarkCircleIcon,
          route: '/user/menu/support',
        },
        {
          label: 'Request a New Doctor',
          icon: UserPlusIcon,
          route: '/user/request-doctor',
        },
        {
          label: 'Refer a Friend',
          icon: UserGroupIcon,
          route: '/user/referral',
        },
        {
          label: 'Notifications',
          icon: BellIcon,
          route: '/user/notifications',
        },
        {
          label: 'Notification Settings',
          icon: Cog6ToothIcon,
          route: '/user/notifications-settings',
        },
      ],
    },
    {
      title: 'Danger Zone',
      items: [
        {
          label: 'Delete Account',
          icon: TrashIcon,
          route: '/user/delete-account',
          isDanger: true,
        },
        {
          label: 'Logout',
          icon: ArrowRightOnRectangleIcon,
          action: handleLogout,
          isDanger: false,
        },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Profile */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-[#C8996A]/30 bg-[#FAF8F5]">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-[#1A1A1A] bg-[#FFD3AC]/30">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handlePhotoClick}
          className="inline-flex items-center space-x-2 text-sm font-medium text-[#C8996A] hover:underline"
        >
          <PencilIcon className="h-4 w-4" />
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
          <h3 className="text-sm uppercase font-semibold text-[#6B6862] mb-4">
            {section.title}
          </h3>
          <div className="space-y-3">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() =>
                    item.route ? router.push(item.route) : item.action()
                  }
                  className={`
                    w-full
                    bg-white
                    border
                    border-[#E7E2D9]
                    hover:border-[#C8996A]
                    rounded-xl
                    p-5
                    flex
                    items-center
                    justify-between
                    shadow-sm
                    hover:shadow-md
                    transition
                    text-left
                    ${item.isDanger ? 'hover:border-red-300' : ''}
                  `}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full flex-shrink-0 ${
                      item.isDanger ? 'bg-red-50 text-red-600' : 'bg-[#FAF8F5] text-[#1A1A1A]'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`font-bold text-base text-left ${
                        item.isDanger ? 'text-red-600' : 'text-[#1A1A1A]'
                      }`}>
                        {item.label}
                      </p>
                      {item.value && (
                        <p className="text-sm text-[#6B6862]">{item.value}</p>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#FAF8F5] flex items-center justify-center flex-shrink-0">
                    <ArrowRightIcon className="h-4 w-4 text-[#1A1A1A]" />
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