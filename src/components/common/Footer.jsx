"use client";
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative z-10 py-10 sm:py-14" style={{ backgroundColor: '#1A1A1A' }}>
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
            <Link href="/login" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Sign In
            </Link>
            <Link href="/contact" style={{ color: 'white' }} className="text-sm sm:text-base hover:opacity-80 transition-opacity text-left">
              Contact
            </Link>
          </div>
        </div>
        
        {/* Footer Disclaimer Strip — renders above the copyright line */}
        <div className="pt-2 mb-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
            {/* Supplement Disclaimer — FDA wording must not be altered */}
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#FFD3AC' }}>
                Supplement Disclaimer
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                These statements have not been evaluated by the Food and Drug
                Administration. Products offered through Ambé are not intended to
                diagnose, treat, cure, or prevent any disease.
              </p>
            </div>

            {/* Practitioner Notice */}
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: '#FFD3AC' }}>
                Practitioner Notice
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Ambé practitioners hold BAMS degrees (Bachelor of Ayurvedic
                Medicine and Surgery) from accredited institutions. Ayurveda is
                not a state-licensed medical practice in the United States. All
                consultations are traditional Ayurvedic wellness support, not the
                practice of conventional medicine.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Ambé wellness programs are educational and supportive in nature.
              They are not a substitute for diagnosis, treatment, or advice from a
              licensed medical physician. If you have a medical condition or are
              taking prescription medications, consult your primary care provider
              before beginning any wellness program.
            </p>
          </div>
        </div>

        {/* Second row - copyright and terms */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mt-6 pt-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
        >
          <p style={{ color: 'white' }} className="text-xs sm:text-sm text-left">
            © 2026 Ambé Wellness. All rights reserved. Operated by Lakshmi Devi Namaha LLC DBA Ambé Wellness.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" style={{ color: 'white' }} className="text-xs sm:text-sm hover:opacity-80 transition-opacity text-left sm:text-left">
              Terms
            </Link>
            <Link href="/privacy-policy" style={{ color: 'white' }} className="text-xs sm:text-sm hover:opacity-80 transition-opacity text-left sm:text-left">
              Privacy Policy
            </Link>
          </div>
        </div>

        <p
          className="text-center mt-2"
          style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}
        >
          Ambe&apos; Wellness is a product of Lakshmi Devi Namaha LLC. All app-related
          services are provided under the iOS developer account of Lakshmi Devi Namaha.
        </p>
      </div>
    </footer>
  );
}