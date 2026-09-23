"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function AmbeBackButton({
  onClick,
  className = "",
  size = 40,
  iconSize = 24,
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`
        flex items-center justify-center rounded-full
        bg-[#2D2D30]/90 hover:bg-[#3D3D42] text-[#FFD3AC]
        border border-white/10 transition-colors shadow-sm
        cursor-pointer focus:outline-none select-none
        ${className}
      `}
    >
      {/* Flutter app rotated play arrow back */}
      <svg
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M16 19V5l-11 7z" />
      </svg>
    </button>
  );
}

export function AmbeCloseButton({
  onClick,
  className = "",
  size = 40,
  iconSize = 22,
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Close"
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`
        flex items-center justify-center rounded-full
        bg-[#2D2D30]/90 hover:bg-[#3D3D42] text-[#FFD3AC]
        border border-white/10 transition-colors shadow-sm
        cursor-pointer focus:outline-none select-none
        ${className}
      `}
    >
      <svg
        style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
