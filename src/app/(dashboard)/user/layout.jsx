'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import UserNav from '@/components/navigation/UserNav';
import UserOnboarding from '@/components/auth/UserOnboarding';

export default function UserLayout({ children }) {
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
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] text-[#353535] font-sans antialiased">
      <UserNav currentPath={pathname} />
      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <footer className="text-center text-[#8C827A] text-xs sm:text-sm py-6 border-t border-[#E7E2D9]/60">
        © {new Date().getFullYear()} Ambé Wellness. All rights reserved.
      </footer>
    </div>
  );
}
