'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import MemberNav from '../../components/MemberNav';
import MemberOnboarding from '../../components/MemberOnboarding';

export default function MemberLayout({ children }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (localStorage.getItem('isNewAccount') === 'true') {
      setShowOnboarding(true);
    }
  }, []);

  const finishOnboarding = () => {
    localStorage.removeItem('isNewAccount');
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return <MemberOnboarding onFinish={finishOnboarding} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <MemberNav currentPath={pathname} />
      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Wrap your page content in a nice card/layout */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {children}
        </div>
      </main>
      {/* optional footer */}
      <footer className="text-center text-gray-500 text-sm py-4">
        © {new Date().getFullYear()} Ambe Wellness
      </footer>
    </div>
  );
}