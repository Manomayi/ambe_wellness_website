'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import ambeLogo from '../../../public/images/logos/ambe_logo.png';
import {
  HomeIcon,
  ChatBubbleLeftEllipsisIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function UserNav({ currentPath }) {
  const pathname = usePathname() || currentPath || '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { label: 'Home', href: '/user/home', Icon: HomeIcon },
    { label: 'Consult', href: '/user/consult', Icon: ChatBubbleLeftEllipsisIcon },
    { label: 'Store', href: '/user/store', Icon: ShoppingCartIcon },
    { label: 'Menu', href: '/user/menu', Icon: UserCircleIcon },
  ];

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

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E2D9] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/user/home" className="flex items-center">
            <Image
              src={ambeLogo}
              alt="AMBÉ"
              className="cursor-pointer w-[100px] sm:w-[130px] md:w-[150px] h-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {tabs.map(({ label, href, Icon }) => {
              const isActive =
                pathname === href || (href !== '/user/home' && pathname.startsWith(`${href}/`));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex items-center space-x-1.5 px-2 py-1.5 rounded-md transition ${
                    isActive
                      ? 'text-[#1A1A1A] font-semibold'
                      : 'text-[#6B6862] hover:text-[#1A1A1A]'
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
            <Link href="/user/home" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src={ambeLogo}
                alt="AMBÉ"
                className="cursor-pointer w-[80px] h-auto object-contain"
              />
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

          {/* Exclusive 4 Main Navigation Tiles */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="space-y-3">
              {tabs.map(({ label, href, Icon }) => {
                const isActive =
                  pathname === href || (href !== '/user/home' && pathname.startsWith(`${href}/`));
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
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
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
                          isActive ? 'text-[#C8996A]' : 'text-[#8C827A] group-hover:translate-x-0.5 transition-transform'
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
