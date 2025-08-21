"use client";
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-8">
      <div className="max-w-7xl mx-auto px-8">
        {/* First row - navigation links */}
        <div className="flex justify-between mb-4">
          <Link href="/enterprise" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
            Enterprise
          </Link>
          <Link href="/membership" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
            Membership
          </Link>
          <Link href="/download" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
            Download App
          </Link>
          <Link href="/signin" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
            Sign In
          </Link>
          <Link href="/contact" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
            Contact
          </Link>
        </div>
        
        {/* Second row - copyright and terms */}
        <div className="flex justify-between items-center">
          <p style={{ color: 'white' }} className="text-sm">
            2025 Ambe All Rights Reserved
          </p>
          <Link href="/terms" style={{ color: 'white' }} className="text-sm hover:opacity-80 transition-opacity">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}