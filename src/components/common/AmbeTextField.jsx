"use client";

import React, { useState } from "react";

export default function AmbeTextField({
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  leadingIcon,
  trailingIcon,
  error,
  required = false,
  autoComplete,
  disabled = false,
  className = "",
  containerClassName = "",
  showPasswordToggle = false,
  onKeyDown,
}) {
  const [obscure, setObscure] = useState(type === "password");

  const effectiveType = showPasswordToggle ? (obscure ? "password" : "text") : type;

  return (
    <div className={`w-full ${containerClassName}`}>
      <div className="relative flex items-center">
        {leadingIcon && (
          <div className="absolute left-4.5 pointer-events-none text-[#FFD3AC] flex items-center justify-center">
            {leadingIcon}
          </div>
        )}

        <input
          type={effectiveType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          onKeyDown={onKeyDown}
          className={`
            w-full bg-white text-[#1E1E1E] placeholder:text-gray-400
            text-[15px] font-sans rounded-full
            py-3.5 transition-all duration-200 outline-none
            border border-transparent focus:border-[#FFD3AC] focus:ring-1 focus:ring-[#FFD3AC]
            ${leadingIcon ? "pl-12" : "pl-5"}
            ${trailingIcon || showPasswordToggle ? "pr-12" : "pr-5"}
            ${error ? "!border-red-500 !focus:ring-red-500" : ""}
            ${className}
          `}
        />

        {showPasswordToggle ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setObscure(!obscure)}
            className="absolute right-4 text-gray-500 hover:text-gray-700 p-1 focus:outline-none cursor-pointer"
          >
            {obscure ? (
              // Eye Slash
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            ) : (
              // Eye Open
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        ) : (
          trailingIcon && (
            <div className="absolute right-4 text-gray-500 flex items-center">
              {trailingIcon}
            </div>
          )
        )}
      </div>

      {error && (
        <p className="mt-1.5 px-4 text-left text-xs text-red-400 font-sans">
          {error}
        </p>
      )}
    </div>
  );
}
