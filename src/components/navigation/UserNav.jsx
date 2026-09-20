"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function UserNav() {
  const pathname = usePathname() || "";
  const { user, profile } = useAuth();

  const tabs = [
    { label: "Home", href: "/user/home" },
    { label: "Consult", href: "/user/consult" },
    { label: "Shop", href: "/user/store" },
    { label: "Courses", href: "/user/courses" },
    { label: "Menu", href: "/user/menu" },
  ];


  const displayName = profile?.first_name || user?.displayName?.split(" ")[0] || "Profile";
  const photoUrl = profile?.profile_picture || user?.photoURL;

  return (
    <header className="sticky top-0 z-40 bg-[#1B1A18]/80 backdrop-blur-md border-b border-white/10 select-none">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* App Logo */}
        <Link href="/user/home" className="flex items-center">
          <Image
            src="/images/logos/ambe_logo.png"
            alt="AMBÉ"
            width={110}
            height={36}
            className="w-[90px] sm:w-[110px] h-auto object-contain cursor-pointer"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {tabs.map(({ label, href }) => {
            const isActive =
              pathname === href || (href !== "/user/home" && pathname.startsWith(`${href}/`));
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-2 py-1 text-sm font-sans font-medium transition-colors ${
                  isActive
                    ? "text-[#FFD3AC] font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#FFD3AC] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions: Notification bell & profile icon */}
        <div className="flex items-center gap-3">
          <Link
            href="/user/notifications"
            className="w-9 h-9 rounded-full bg-[#2D2D30]/80 border border-white/10 flex items-center justify-center text-[#FFD3AC] hover:bg-[#3D3D42] transition"
            aria-label="Notifications"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </Link>

          <Link
            href="/user/menu"
            className="flex items-center gap-2 pl-1 group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#FFD3AC] text-[#1E1E1E] flex items-center justify-center font-bold text-xs overflow-hidden border border-white/20">
              {photoUrl ? (
                <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="hidden sm:inline text-xs font-medium text-gray-200 group-hover:text-white font-sans max-w-[90px] truncate">
              {displayName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
