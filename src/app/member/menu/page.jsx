'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { BellIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function MemberMenuPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [photoURL, setPhotoURL] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) return router.push('/login');
      setUser(u);
      setPhotoURL(u.photoURL || '');
      setDisplayName(u.displayName || '');
      setEmail(u.email || '');
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const storage = getStorage();
    const picRef = storageRef(storage, `images/${user.uid}/profile_picture.png`);
    try {
      await deleteObject(picRef).catch(() => {});
      await uploadBytes(picRef, file);
      const url = await getDownloadURL(picRef);
      await auth.currentUser.updateProfile({ photoURL: url });
      setPhotoURL(url);
    } catch (err) {
      console.error(err);
      alert('Error uploading photo');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const menuItems = [
    { label: 'Name', route: '/member/menu/edit-name' },
    { label: 'Email', route: '/member/menu/edit-email' },
    { label: 'Password', route: '/member/menu/edit-password' },
    { label: 'Change Photo', action: handleChangePhoto },
    { label: 'Questionnaire Results', route: '/member/menu/questionnaire/results' },
    { label: 'Consultation History', route: '/member/consult' },
    { label: 'Purchase History', route: '/member/menu/purchase-history' },
    { label: 'Support', route: '/member/menu/support' },
    { label: 'Notifications Settings', route: '/member/notifications-settings' },
    { label: 'Delete Account', route: '/member/menu/delete-account' },
    { label: 'Logout', action: handleLogout }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-800">Menu</h1>
        <button
          onClick={() => router.push('/member/notifications')}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <BellIcon className="h-6 w-6 text-gray-600" />
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-6">
        <div className="relative">
          <img
            src={photoURL}
            alt="Profile"
            className="h-20 w-20 rounded-full object-cover"
          />
          <button
            onClick={handleChangePhoto}
            className="absolute bottom-0 right-0 bg-green-600 p-1 rounded-full shadow-md hover:bg-green-700 transition"
          >
            <ChevronRightIcon className="h-4 w-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadPhoto}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
          <p className="text-gray-600">{email}</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-white shadow-md rounded-xl divide-y divide-gray-200">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.route ? () => router.push(item.route) : item.action}
            className="w-full text-left px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
          >
            <span className="font-medium text-gray-800">{item.label}</span>
            <ChevronRightIcon className="h-5 w-5 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
