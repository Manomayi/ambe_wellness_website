'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpertHomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push('/doctor/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
    </div>
  );
}