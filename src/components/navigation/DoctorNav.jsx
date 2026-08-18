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
              className="h-6 w-6 rounded-full object-cover border-2 border-transparent group-hover:border-[#C8996A] transition"
            />
          )
        : Cog6ToothIcon
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2D9] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        <div className="text-2xl font-bold text-[#C8996A]">Ambe Doctor</div>
        <nav className="flex space-x-6">
          {tabs.map(({ label, href, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center space-x-1 px-2 py-1 rounded-md transition ${
                  isActive ? 'text-[#C8996A]' : 'text-[#6B6862] hover:text-[#1A1A1A]'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? 'text-[#C8996A]'
                      : 'text-[#8C827A] group-hover:text-[#1A1A1A]'
                  }`}
                />
                <span className="text-sm font-medium">{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 mx-auto h-0.5 w-6 bg-[#C8996A] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}