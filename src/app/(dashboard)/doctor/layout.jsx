'use client';

import { usePathname } from 'next/navigation';
import DoctorNav from '@/components/navigation/DoctorNav';
import DoctorBottomNav from '@/components/navigation/DoctorBottomNav';
import BackgroundVideo from '@/components/common/BackgroundVideo';

export default function DoctorLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-[#1E1E1E] text-white font-sans antialiased flex flex-col selection:bg-[#FFD3AC] selection:text-[#1E1E1E]">
      {/* Background Video matching Flutter App */}
      <BackgroundVideo opacity={0.3} />

      {/* Top Header */}
      <DoctorNav currentPath={pathname} />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 w-full pb-24 md:pb-12">
        <div className={`max-w-4xl mx-auto ${pathname === '/doctor/home' ? 'px-0 sm:px-6 md:px-8 py-0 sm:py-6' : 'px-3 sm:px-6 md:px-8 py-4 sm:py-6'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Flutter NavigationBar) */}
      <div className="md:hidden">
        <DoctorBottomNav />
      </div>
    </div>
  );
}
