"use client";

import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function AccountVerificationRequired({
  title = "Account Verification Required",
  message = "Your account is currently under review. You will be able to access this section once your account has been verified.",
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4 max-w-md mx-auto min-h-[50vh] select-none">
      <div className="w-24 h-24 rounded-full bg-[#1B1A18]/80 border border-white/10 flex items-center justify-center mb-6 text-[#FFD3AC]/70 shadow-lg">
        <ShieldCheckIcon className="w-12 h-12 text-[#FFD3AC]" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-sans tracking-tight">
        {title}
      </h2>
      <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-sans max-w-sm">
        {message}
      </p>
    </div>
  );
}
