"use client";

import React from "react";
import Link from "next/link";

export function UserMenuSection({ title, children, className = "" }) {
  return (
    <div className={`mb-6 text-left ${className}`}>
      {title && (
        <h3 className="text-white text-[18px] font-semibold tracking-wide mb-3 font-sans">
          {title}
        </h3>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function UserMenuItem({
  title,
  icon,
  href,
  onClick,
  textColor = "text-[#1E1E1E]",
  trailingText,
  badge,
  danger = false,
}) {
  const content = (
    <div
      className={`
        w-full flex items-center justify-between
        bg-white px-5 py-4 rounded-[20px]
        shadow-sm hover:shadow-md transition-all duration-150
        border border-transparent hover:border-[#FFD3AC]/40
        cursor-pointer select-none group
      `}
    >
      <div className="flex items-center gap-3.5">
        {icon && (
          <div
            className={`flex items-center justify-center w-6 h-6 ${
              danger ? "text-red-500" : "text-[#1E1E1E] group-hover:text-[#C2691C]"
            } transition-colors`}
          >
            {icon}
          </div>
        )}
        <span
          className={`text-[15px] font-medium font-sans ${
            danger ? "text-red-500" : textColor
          }`}
        >
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {trailingText && (
          <span className="text-xs text-gray-500 font-sans">{trailingText}</span>
        )}
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#FFD3AC] text-[#1E1E1E]">
            {badge}
          </span>
        )}
        <svg
          className={`w-5 h-5 ${
            danger ? "text-red-400" : "text-gray-400 group-hover:text-[#1E1E1E]"
          } transition-transform group-hover:translate-x-0.5`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left focus:outline-none">
      {content}
    </button>
  );
}
