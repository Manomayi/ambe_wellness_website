"use client";
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-3 sm:py-4">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        {/* First row - navigation links */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 lg:gap-12 xl:justify-between xl:flex-1">
            <Link href="/enterprise" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Enterprise
            </Link>
            <Link href="/membership" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Membership
            </Link>
            <Link href="/download" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Download App
            </Link>
            <Link href="/signin" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Sign In
            </Link>
            <Link href="/contact" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Contact
            </Link>
          </div>
        </div>
        
        {/* Second row - copyright and terms */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-6">
          <p style={{ color: 'white' }} className="text-xs sm:text-sm text-left">
            2026 Ambé All Rights Reserved By Lakshmi Devi Namaha LLC
          </p>
          <Link href="/terms" style={{ color: 'white' }} className="text-xs sm:text-sm hover:opacity-80 transition-opacity text-left sm:text-left">
            Terms
          </Link>
          <Link href="/privacy-policy" style={{ color: 'white' }} className="text-xs sm:text-sm hover:opacity-80 transition-opacity text-left sm:text-left">
            Privacy Policy
          </Link>
        </div>
        
        {/* Disclaimer text */}
        <div className="pt-6">
          <p style={{ color: 'white' }} className="text-xs leading-relaxed">
            All content and resources provided by AMBE are intended for <strong>educational purposes only</strong>. They do not constitute medical advice, diagnosis, or treatment.
            Any cleanse, detox program, or health regimen should be undertaken only under the supervision of AMBE's team of qualified wellness practitioners or 
            other vetted professionals with appropriate experience. This ensures that your individual constitution ("Prakriti"), health status, 
            and unique needs are addressed safely. Improper or unsupervised application of these protocols can lead to harm. Always consult your licensed healthcare 
            provider before starting any new wellness or cleansing program. By using AMBE resources, you acknowledge and
            accept that you are responsible for your own health decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}