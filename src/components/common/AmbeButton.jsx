"use client";

import React from "react";

export default function AmbeButton({
  children,
  text,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  isOutlined = false,
  className = "",
  width,
  style = {},
}) {
  const content = children || text;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
        ...style,
      }}
      className={`
        relative inline-flex items-center justify-center font-sans
        px-8 py-3.5 rounded-full text-[16px] font-semibold tracking-[0.03em]
        transition-all duration-200 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${
          isOutlined
            ? "border-2 border-[#FFD3AC] text-[#FFD3AC] bg-transparent hover:bg-[#FFD3AC]/10"
            : "bg-[#FFD3AC] text-[#1E1E1E] hover:bg-[#ffe2c7] shadow-sm"
        }
        ${className}
      `}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Please wait…</span>
        </span>
      ) : (
        content
      )}
    </button>
  );
}
