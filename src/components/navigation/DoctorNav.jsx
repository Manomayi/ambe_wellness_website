'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import {
  HomeIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

export default function DoctorNav({ currentPath }) {
  const pathname = usePathname() || currentPath || '';
  const [photoURL, setPhotoURL] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Grab the doctor’s photo for the “Menu” tab
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.photoURL) {
          setPhotoURL(user.photoURL);
        } else {
          try {
            const snap = await getDoc(doc(db, 'doctors', user.uid));
            if (snap.exists() && snap.data()?.profile_picture) {
              setPhotoURL(snap.data().profile_picture);
            }
          } catch (e) {
            // Ignore error
          }
        }
      }
    });
    return unsub;
  }, []);

  const tabs = [
    { label: 'Home',          href: '/doctor/home',          Icon: HomeIcon },
    { label: 'Consult',       href: '/doctor/consultations', Icon: CalendarDaysIcon },
    { label: 'Messages',      href: '/doctor/messages',      Icon: ChatBubbleLeftEllipsisIcon },
    { label: 'Patients',      href: '/doctor/users',         Icon: UsersIcon },
    {
      label: 'Menu',
      href: '/doctor/menu',
      // If we have a photoURL, render that; otherwise fall back to the cog icon
      Icon: photoURL
        ? function AvatarIcon({ className }) {
            return (
              <img
                src={photoURL}
                alt="Profile"
                className={`rounded-full object-cover border-2 border-transparent group-hover:border-[#C8996A] transition ${
                  className || 'h-5 w-5'
                }`}
              />
            );
          }
        : Cog6ToothIcon
    }
  ];

  const isTabActive = (href) => {
    if (pathname === href) return true;
    if (
      href === '/doctor/home' &&
      (pathname === '/doctor/dashboard' || pathname.startsWith('/doctor/dashboard/'))
    ) {
      return true;
    }
    if (
      href === '/doctor/menu' &&
      (pathname.startsWith('/doctor/menu/') ||
        pathname.startsWith('/doctor/schedule') ||
        pathname.startsWith('/doctor/earnings') ||
        pathname.startsWith('/doctor/notifications-settings'))
    ) {
      return true;
    }
    if (href !== '/doctor/home' && href !== '/doctor/menu' && pathname.startsWith(`${href}/`)) {
      return true;
    }
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2D9] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          <Link
            href="/doctor/home"
            className="text-2xl font-bold text-[#C8996A] tracking-tight whitespace-nowrap"
          >
            Ambe Doctor
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {tabs.map(({ label, href, Icon }) => {
              const isActive = isTabActive(href);
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

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            className="md:hidden relative z-[60] p-2 rounded-xl text-[#1A1A1A] hover:bg-black/5 focus:outline-none transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Clean & Impressive Mobile Menu Drawer */}
      <div
        className={`md:hidden fixed inset-0 z-[55] bg-[#FAF8F5] transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#E7E2D9]/70 bg-white">
            <Link
              href="/doctor/home"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xl font-bold text-[#C8996A]"
            >
              Ambe Doctor
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="p-2 rounded-full text-[#1A1A1A] hover:bg-black/5 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Tiles */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="space-y-3">
              {tabs.map(({ label, href, Icon }) => {
                const isActive = isTabActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center justify-between p-4 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-white shadow-sm border border-[#C8996A]/60 text-[#1A1A1A] font-bold ring-1 ring-[#FFD3AC]'
                        : 'bg-white border border-[#E7E2D9] text-[#353535] hover:border-[#C8996A] hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors overflow-hidden ${
                          isActive
                            ? 'bg-[#FFD3AC] text-[#1A1A1A]'
                            : 'bg-[#FAF8F5] border border-[#E7E2D9] text-[#8C827A] group-hover:text-[#1A1A1A]'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-lg font-semibold tracking-tight">
                        {label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#C8996A]" />
                      )}
                      <ChevronRightIcon
                        className={`h-5 w-5 ${
                          isActive
                            ? 'text-[#C8996A]'
                            : 'text-[#8C827A] group-hover:translate-x-0.5 transition-transform'
                        }`}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}