'use client';
import React from 'react';
import Link from 'next/link';

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
  const baseStyles = 'px-20 py-3 rounded-full font-medium transition-all duration-200 text-center inline-block touch-manipulation select-none active:scale-[0.98]';
  
  const variantStyles = {
    primary: `bg-[#FFD3AC] text-[#353535] md:hover:bg-[#353535] md:hover:text-white`,
    light: `bg-[#FFD3AC] text-[#353535] md:hover:bg-white md:hover:text-[#353535]`,
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  const classes = `${baseStyles} ${variantStyles[variant]} ${widthStyles} ${disabledStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} prefetch={false} className={classes}>
        {children}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}