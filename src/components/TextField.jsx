// src/components/TextField.jsx
'use client';
import React from 'react';

export default function TextField({
  label, type = 'text', value, onChange,
  error, icon: Icon, ...rest
}) {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{label}</label>
      <div className="flex items-center border border-gray-300 rounded">
        {Icon && <Icon className="mx-2 text-gray-500"/>}
        <input
          type={type}
          className="flex-1 p-2 focus:outline-none text-black"
          value={value}
          onChange={onChange}
          {...rest}
        />
      </div>
      {error && <p className="mt-1 text-red-600 text-sm">{error}</p>}
    </div>
  );
}