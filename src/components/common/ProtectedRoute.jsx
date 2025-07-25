"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children, userType = null }) {
  const router = useRouter();
  const { user, loading, userType: authUserType } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userType && authUserType !== userType) {
        // Redirect to appropriate home if wrong user type
        router.push(authUserType === 'doctor' ? '/doctor/home' : '/user/home');
      }
    }
  }, [user, loading, userType, authUserType, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user || (userType && authUserType !== userType)) {
    return null;
  }

  return children;
}