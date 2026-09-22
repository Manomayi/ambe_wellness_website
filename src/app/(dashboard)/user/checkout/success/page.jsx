"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/common/ProtectedRoute';

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear payment intent from session storage
    sessionStorage.removeItem('paymentIntentId');
    
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      router.push('/user/home');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <ProtectedRoute userType="user">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircleIcon className="h-20 w-20 text-[#FFD3AC] mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Purchase Completed!
          </h1>
          
          <p className="text-sm text-white/70 mb-8">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/user/home')}
              className="w-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] py-3.5 rounded-xl font-bold text-sm transition uppercase tracking-wider shadow-md cursor-pointer"
            >
              Return to Home
            </button>
            
            <button
              onClick={() => router.push('/user/menu/purchase_history')}
              className="w-full bg-white/10 text-white border border-white/15 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/15 transition cursor-pointer"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}