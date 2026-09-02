"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * HIPAA §164.312(a)(2)(iii) - Automatic logoff safeguard.
 * - 15 minutes for healthcare practitioners (doctors).
 * - 30 minutes for patient accounts.
 */
export function useIdleTimeout() {
  const { user, userType, signOut } = useAuth();
  const router = useRouter();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Timeout duration in milliseconds
    const timeoutMs = userType === 'doctor' ? 15 * 60 * 1000 : 30 * 60 * 1000;

    const handleTimeout = async () => {
      try {
        if (signOut) {
          await signOut();
        }
        alert(
          userType === 'doctor'
            ? 'Your practitioner session timed out after 15 minutes of inactivity for HIPAA compliance.'
            : 'Your session has timed out after 30 minutes of inactivity. Please sign in again.'
        );
        router.push('/login');
      } catch (err) {
        console.error('Session timeout signout error:', err);
        router.push('/login');
      }
    };

    const resetTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(handleTimeout, timeoutMs);
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [user, userType, signOut, router]);
}
