'use client';
import React from 'react';
import { colors } from '@/lib/design-tokens';

export default function Button({ 
  onClick, 
  children, 
  disabled, 
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button'
}) {
  const baseStyles = 'px-20 py-3 rounded-full font-medium transition-all duration-200 text-center inline-block';
  
  const variantStyles = {
    primary: `bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white`,
    light: `bg-[#FFD3AC] text-[#353535] hover:bg-white hover:text-[#353535]`,
  };
  
  const widthStyles = fullWidth ? 'w-full' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}