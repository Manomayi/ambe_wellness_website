"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-50 py-4 sm:py-6 sm:border-b border-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-16">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/">
              <Image
                src="/images/logos/ambe_logo.png"
                alt="AMBE"
                width={100}
                height={33}
                className="cursor-pointer w-[80px] sm:w-[100px] md:w-[120px]"
                priority
              />
            </Link>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden relative z-[60]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: mobileMenuOpen ? '#353535' : 'white' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-8 xl:gap-12">
            <Link
              href="/shop"
              className="text-xs lg:text-sm"
              style={{ color: pathname === '/shop' ? '#FFD3AC' : 'white' }}
            >
              Shop
            </Link>
            <Link
              href="/enterprise"
              className="text-xs lg:text-sm" 
              style={{ color: pathname === '/enterprise' ? '#FFD3AC' : 'white' }}
            >
              Enterprise
            </Link>
            <Link 
              href="/membership" 
              className="text-xs lg:text-sm" 
              style={{ color: pathname === '/membership' ? '#FFD3AC' : 'white' }}
            >
              Membership
            </Link>
            <Link 
              href="/resources" 
              className="text-xs lg:text-sm" 
              style={{ color: pathname === '/resources' ? '#FFD3AC' : 'white' }}
            >
              Resources
            </Link>
            <button className="border border-white px-3 lg:px-6 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm hover:bg-white hover:text-black transition-colors whitespace-nowrap" style={{ color: 'white' }}>
              Download App
            </button>
            
            {/* Divider */}
            <div className="hidden lg:block h-8 w-px bg-white opacity-50"></div>
            
            <Link href="/login" className="text-xs lg:text-sm" style={{ color: 'white' }}>
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
          <div className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: '#E5E5E5' }}>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Image
                src="/images/logos/ambe_logo.png"
                alt="AMBE"
                width={80}
                height={27}
                className="cursor-pointer"
              />
            </Link>
            <button 
              onClick={() => setMobileMenuOpen(false)}
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
              <Link
                href="/shop"
                className="text-2xl font-light"
                style={{ color: pathname === '/shop' ? '#FFD3AC' : '#353535' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/enterprise"
                className="text-2xl font-light" 
                style={{ color: pathname === '/enterprise' ? '#FFD3AC' : '#353535' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Enterprise
              </Link>
              <Link 
                href="/membership" 
                className="text-2xl font-light" 
                style={{ color: pathname === '/membership' ? '#FFD3AC' : '#353535' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Membership
              </Link>
              <Link 
                href="/resources" 
                className="text-2xl font-light" 
                style={{ color: pathname === '/resources' ? '#FFD3AC' : '#353535' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <button 
                className="border px-6 py-3 rounded-full text-lg hover:text-white transition-colors w-fit" 
                style={{ borderColor: '#FFD3AC', backgroundColor: '#FFD3AC', color: '#353535' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Download App
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}