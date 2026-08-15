'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BackButton({
  label = 'Back to Menu',
  href = '/user/menu',
  className = '',
}) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm font-medium text-[#6B6862] hover:text-[#1A1A1A] transition-colors py-2 px-3.5 -ml-2 rounded-xl hover:bg-black/[0.04] active:scale-95 group w-fit cursor-pointer ${className}`}
    >
      <ArrowLeftIcon className="h-4 w-4 text-[#6B6862] group-hover:text-[#1A1A1A] group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
}
