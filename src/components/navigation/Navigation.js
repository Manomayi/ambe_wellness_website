"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from '@/lib/nav-links';
import ambeLogo from '../../../public/images/logos/ambe_logo.png';

export default function Navigation({ light = false, sticky = false, className = '' }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkColor = (path) => {
    if (pathname === path) return "#C8996A";
    return light ? "#353535" : "white";
  };

  const navText = light ? "#353535" : "white";
  const dividerColor = light ? "#C8996A" : "white";
  const positionClass = sticky
    ? "sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#ECE7DE] py-4"
    : "absolute top-0 left-0 right-0 z-50 py-4 sm:py-6";

  return (
    <>
      <nav className={`${positionClass} ${className}`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-16">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/">
              <Image
                src={ambeLogo}
                alt="AMBE"
                className="cursor-pointer w-[110px] sm:w-[140px] md:w-[170px] lg:w-[205px] xl:w-[220px] h-auto"
                priority
              />
            </Link>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden relative z-[60] p-2 rounded-lg focus:outline-none transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              style={{ color: mobileMenuOpen ? "#353535" : navText }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-3 lg:gap-6 xl:gap-9">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs lg:text-sm whitespace-nowrap transition-colors hover:text-[#C8996A]"
                  style={{ color: linkColor(link.href) }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/download"
                className={`border px-3 lg:px-6 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm transition-colors whitespace-nowrap ${
                  light
                    ? "border-charcoal text-charcoal hover:bg-charcoal hover:text-white"
                    : "border-white hover:bg-white hover:text-black"
                }`}
                style={{ color: light ? "#353535" : "white" }}
              >
                Download App
              </Link>
              
              {/* Divider */}
              <div
                className="hidden lg:block h-8 w-px opacity-50"
                style={{ backgroundColor: dividerColor }}
              />
              
              <Link href="/login" className="text-xs lg:text-sm transition-colors hover:text-[#C8996A]" style={{ color: navText }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu - Full screen overlay sliding from right */}
      <div 
        className={`md:hidden fixed inset-0 z-[55] bg-white transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile menu header with close button */}
          <div className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: '#F4F1EA' }}>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src={ambeLogo}
                alt="AMBE"
                className="cursor-pointer h-auto w-[110px] sm:w-[130px]"
              />
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{ color: '#353535' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Mobile menu items */}
          <div className="flex-1 px-8 py-8">
            <div className="flex flex-col space-y-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-2xl font-light"
                  style={{ color: pathname === link.href ? '#C8996A' : '#353535' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/download"
                className="border px-6 py-3 rounded-full text-lg hover:text-white transition-colors w-fit"
                style={{ borderColor: "#FFD3AC", backgroundColor: "#FFD3AC", color: "#353535" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Download App
              </Link>
              <Link
                href="/login"
                className="text-lg font-light pt-2"
                style={{ color: '#353535' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}