'use client';
import React from 'react';
import Link from 'next/link';
import { colors } from '@/lib/design-tokens';

export default function Button({
  onClick,
  children,
  disabled,
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button',
  href,
}) {
  const baseStyles = 'px-20 py-3 rounded-full font-medium transition-all duration-200 text-center inline-block';

  const variantStyles = {
    primary: `bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white`,
    light: `bg-[#FFD3AC] text-[#353535] hover:bg-white hover:text-[#353535]`,
  };

  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const combinedClass = `${baseStyles} ${variantStyles[variant]} ${widthStyles} ${disabledStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClass}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClass}
    >
      {children}
    </button>
  );
}