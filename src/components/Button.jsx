// src/components/Button.jsx
'use client';
import React from 'react';

export default function Button({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:opacity-50"
    >
      {children}
    </button>
  );
}