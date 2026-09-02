"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

export default function ProtectedRoute({ children, userType = null }) {
  const router = useRouter();
  const { user, loading, userType: authUserType } = useAuth();
  
  // HIPAA §164.312(a)(2)(iii) - Automatic Session Inactivity Timeout
  useIdleTimeout();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!user.emailVerified) {
        router.push(`/verify-email?email=${encodeURIComponent(user.email || '')}&role=${authUserType || ''}`);
      } else if (userType && authUserType !== userType) {
        // Redirect to appropriate home if wrong user type
        router.push(authUserType === 'doctor' ? '/doctor/home' : '/user/home');
      }
    }
  }, [user, loading, userType, authUserType, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C2691C]"></div>
      </div>
    );
  }

  if (!user || !user.emailVerified || (userType && authUserType !== userType)) {
    return null;
  }

  return children;
}
