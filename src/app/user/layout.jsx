'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UserNav from '../../components/UserNav';
import UserOnboarding from '../../components/UserOnboarding';

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
    return <UserOnboarding onFinish={finishOnboarding} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <UserNav currentPath={pathname} />
      <main className="flex-1 w-full px-6 md:px-12 lg:px-24 xl:px-32 py-12">
        {/* Fluid full-width container */}
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
      <footer className="text-center text-gray-500 text-sm py-6">
        © {new Date().getFullYear()} Ambe Wellness
      </footer>
    </div>
  );
}
