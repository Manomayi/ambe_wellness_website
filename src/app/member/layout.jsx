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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <MemberNav currentPath={pathname} />
      <main className="flex-1 w-full px-6 md:px-12 lg:px-24 xl:px-32 py-12">
        {/* Fluid full-width container */}
        <div className="w-full p-8">
          {children}
        </div>
      </main>
      <footer className="text-center text-gray-500 text-sm py-6">
        © {new Date().getFullYear()} Ambe Wellness
      </footer>
    </div>
  );
}
