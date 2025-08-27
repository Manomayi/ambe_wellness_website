"use client";
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* First row - navigation links */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 lg:gap-12 xl:justify-between xl:flex-1">
            <Link href="/enterprise" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-center sm:text-left">
              Enterprise
            </Link>
            <Link href="/membership" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-center sm:text-left">
              Membership
            </Link>
            <Link href="/download" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-center sm:text-left">
              Download App
            </Link>
            <Link href="/signin" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-center sm:text-left">
              Sign In
            </Link>
            <Link href="/contact" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-center sm:text-left">
              Contact
            </Link>
          </div>
        </div>
        
        {/* Second row - copyright and terms */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <p style={{ color: 'white' }} className="text-xs sm:text-sm text-center sm:text-left">
            2025 Ambe All Rights Reserved
          </p>
          <Link href="/terms" style={{ color: 'white' }} className="text-xs sm:text-sm hover:opacity-80 transition-opacity">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}