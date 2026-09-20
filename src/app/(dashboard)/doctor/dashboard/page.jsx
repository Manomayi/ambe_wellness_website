'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DoctorDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/doctor/home');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent" />
    </div>
  );
}