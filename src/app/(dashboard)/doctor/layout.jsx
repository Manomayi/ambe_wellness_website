'use client';

import { usePathname } from 'next/navigation';
import DoctorNav from '@/components/navigation/DoctorNav';

export default function DoctorLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5] text-[#353535] font-sans antialiased">
      <DoctorNav currentPath={pathname} />
      <main className="flex-1 w-full px-4 sm:px-6 md:px-12 lg:px-24 xl:px-32 py-8 sm:py-12">
        {/* Fluid full-width container */}
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          {children}
        </div>
      </main>
      <footer className="text-center text-[#8C827A] text-sm py-6 border-t border-[#E7E2D9]/60">
        © {new Date().getFullYear()} Ambe Wellness
      </footer>
    </div>
  );
}
