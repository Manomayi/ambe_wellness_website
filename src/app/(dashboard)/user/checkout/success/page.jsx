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
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircleIcon className="h-20 w-20 text-green-600 mx-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Purchase Completed!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/user/home')}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Return to Home
            </button>
            
            <button
              onClick={() => router.push('/user/menu/purchase_history')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}