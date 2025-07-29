"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 py-6 border-b border-white">
      <div className="max-w-7xl mx-auto lg:px-16">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="text-4xl font-bold" style={{ color: '#FFD3AC', fontFamily: 'Playfair Display, serif' }}>
              AMBE
            </div>
          </Link>
          
          {/* Right side navigation */}
          <div className="flex items-center gap-12">
            <Link 
              href="#" 
              className="text-sm" 
              style={{ color: 'white' }}
            >
              Enterprise
            </Link>
            <Link 
              href="/membership" 
              className="text-sm" 
              style={{ color: pathname === '/membership' ? '#FFD3AC' : 'white' }}
            >
              Membership
            </Link>
            <button className="border border-white px-6 py-2 rounded-full text-sm hover:bg-white hover:text-black transition-colors" style={{ color: 'white' }}>
              Download App
            </button>
            
            {/* Divider */}
            <div className="h-8 w-px bg-white opacity-50"></div>
            
            <Link href="/login" className="text-sm" style={{ color: 'white' }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}