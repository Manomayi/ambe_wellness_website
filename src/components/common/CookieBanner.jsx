'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('ambe_cookies')) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('ambe_cookies', '1');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('ambe_cookies', '0');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[400] flex items-center justify-between gap-6 px-6 py-4 sm:px-12" style={{ backgroundColor: '#353535' }}>
      <p className="text-xs sm:text-sm leading-relaxed max-w-2xl" style={{ color: '#cccccc' }}>
        We use cookies to personalize your experience and improve our services. By continuing to use this site, you agree to our{' '}
        <Link href="/privacy-policy" className="underline" style={{ color: '#FFD3AC' }}>Privacy Policy</Link>{' '}and{' '}
        <Link href="/terms" className="underline" style={{ color: '#FFD3AC' }}>Cookie Policy</Link>.
      </p>
      <div className="flex gap-3 flex-shrink-0">
        <button
          onClick={accept}
          className="px-5 py-2 rounded-full text-xs font-bold cursor-pointer"
          style={{ backgroundColor: '#FFD3AC', color: '#353535' }}
        >
          Accept All
        </button>
        <button
          onClick={decline}
          className="px-5 py-2 rounded-full text-xs border cursor-pointer"
          style={{ color: '#cccccc', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent' }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
