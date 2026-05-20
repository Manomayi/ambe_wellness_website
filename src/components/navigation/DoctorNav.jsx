'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  HomeIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function DoctorNav() {
  const pathname = usePathname();
  const [photoURL, setPhotoURL] = useState(null);

  // grab the doctor’s photo for the “Menu” tab
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      if (user) setPhotoURL(user.photoURL);
    });
    return unsub;
  }, []);

  const tabs = [
    { label: 'Home',          href: '/doctor/home',          Icon: HomeIcon },
    { label: 'Calendar',      href: '/doctor/consultations', Icon: CalendarDaysIcon },
    { label: 'Messages',      href: '/doctor/messages',      Icon: ChatBubbleLeftEllipsisIcon },
    { label: 'Users',      href: '/doctor/users',      Icon: UsersIcon },
    {
      label: 'Menu',
      href: '/doctor/menu',
      // if we have a photoURL, render that; otherwise fall back to the cog icon
      Icon: photoURL
        ? () => (
            <img
              src={photoURL}
              alt="Me"
              className="h-6 w-6 rounded-full object-cover border-2 border-transparent group-hover:border-green-500 transition"
            />
          )
        : Cog6ToothIcon
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-green-600">Ambé Doctor</div>
        <nav className="flex space-x-6">
          {tabs.map(({ label, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center space-x-1 px-2 py-1 rounded-md transition ${
                  isActive ? 'text-green-600' : 'text-gray-600 hover:text-green-500'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-green-600'
                      : 'text-gray-400 group-hover:text-green-500'
                  }`}
                />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-6 bg-green-600" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}