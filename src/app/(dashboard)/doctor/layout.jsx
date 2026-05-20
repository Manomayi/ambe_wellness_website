'use client';

import { usePathname } from 'next/navigation';
import DoctorNav from '@/components/navigation/DoctorNav';

export default function DoctorLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <DoctorNav currentPath={pathname} />
      <main className="flex-1 w-full px-6 md:px-12 lg:px-24 xl:px-32 py-12">
        {/* Fluid full-width container */}
        <div className="max-w-4xl mx-auto p-8">
          {children}
        </div>
      </main>
      <footer className="text-center text-gray-500 text-sm py-6">
        © {new Date().getFullYear()} Ambé Wellness
      </footer>
    </div>
  );
}
