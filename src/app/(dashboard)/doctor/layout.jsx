'use client';

import { usePathname } from 'next/navigation';
import DoctorNav from '@/components/navigation/DoctorNav';
import DoctorBottomNav from '@/components/navigation/DoctorBottomNav';
import BackgroundVideo from '@/components/common/BackgroundVideo';

export default function DoctorLayout({ children }) {
  const pathname = usePathname();
  const isChatPage =
    pathname?.startsWith('/doctor/messages/') && pathname !== '/doctor/messages';

  return (
    <div
      className={`relative bg-[#1E1E1E] text-white font-sans antialiased flex flex-col selection:bg-[#FFD3AC] selection:text-[#1E1E1E] ${
        isChatPage ? 'h-screen overflow-hidden' : 'min-h-[100dvh]'
      }`}
    >
      {/* Background Video matching Flutter App */}
      <BackgroundVideo opacity={0.3} />

      {/* Top Header */}
      <DoctorNav currentPath={pathname} />

      {/* Main Content Area */}
      <main
        className={`relative z-10 flex-1 w-full ${
          isChatPage
            ? 'h-[calc(100vh-4rem)] overflow-hidden pb-0 flex flex-col'
            : 'pb-24 md:pb-12'
        }`}
      >
        <div
          className={
            isChatPage
              ? 'h-full w-full max-w-5xl mx-auto p-0 flex flex-col overflow-hidden'
              : `max-w-4xl mx-auto ${
                  pathname === '/doctor/home'
                    ? 'px-0 sm:px-6 md:px-8 py-0 sm:py-6'
                    : 'px-3 sm:px-6 md:px-8 py-4 sm:py-6'
                }`
          }
        >
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Flutter NavigationBar) */}
      {!isChatPage && (
        <div className="md:hidden">
          <DoctorBottomNav />
        </div>
      )}
    </div>
  );
}
