'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AmbeBackButton from './AmbeBackButton';

export default function BackButton({
  label,
  href = '/user/menu',
  className = '',
  forceHref = false,
}) {
  const router = useRouter();

  const handleBack = () => {
    if (forceHref && href) {
      router.push(href);
    } else if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  if (!label || label === 'Back' || label === 'Back to Menu') {
    return <AmbeBackButton onClick={handleBack} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <AmbeBackButton onClick={handleBack} />
      <span className="text-white/80 text-sm font-medium">{label}</span>
    </div>
  );
}

