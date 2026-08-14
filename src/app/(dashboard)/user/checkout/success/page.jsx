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
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E7E2D9] rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircleIcon className="h-20 w-20 text-[#C8996A] mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            Purchase Completed!
          </h1>
          
          <p className="text-sm text-[#6B6862] mb-8">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/user/home')}
              className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3 rounded-lg font-medium text-sm transition uppercase tracking-wider shadow-sm"
            >
              Return to Home
            </button>
            
            <button
              onClick={() => router.push('/user/menu/purchase_history')}
              className="w-full bg-[#FAF8F5] text-[#1A1A1A] border border-[#E7E2D9] py-3 rounded-lg font-medium text-sm hover:bg-[#F4F1EA] transition"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}