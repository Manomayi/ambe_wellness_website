'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid';
import { ALL_COUNTRIES } from './countries';

export const COUNTRIES = ALL_COUNTRIES;

export default function PhoneInputWithCountry({
  value = '',
  onChange,
  defaultCountryCode = 'US',
  placeholder = 'Phone number',
  error,
  id = 'phone-input',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Find initial country
  const initialCountry = COUNTRIES.find((c) => c.code === defaultCountryCode) || COUNTRIES[0];
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [localNumber, setLocalNumber] = useState('');

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const numberInputRef = useRef(null);

  // Sync internal state when external `value` changes
  useEffect(() => {
    if (!value) {
      setLocalNumber('');
      return;
    }

    // Check if value already starts with any country dial code
    const matchingCountry = COUNTRIES.slice()
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .find((c) => value.startsWith(c.dialCode));

    if (matchingCountry) {
      setSelectedCountry(matchingCountry);
      setLocalNumber(value.slice(matchingCountry.dialCode.length).trim());
    } else {
      setLocalNumber(value.replace(/^\+/, '').trim());
    }
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter countries by name or dial code
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES;
    const q = searchQuery.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    // Emit new combined value
    const cleanLocal = localNumber.replace(/[^\d]/g, '');
    const combined = cleanLocal ? `${country.dialCode}${cleanLocal}` : '';
    onChange?.(combined);
    numberInputRef.current?.focus();
  };

  const handleNumberChange = (e) => {
    const rawVal = e.target.value;
    
    // Check if user pasted a full number with a plus sign, e.g. +919925034481
    if (rawVal.startsWith('+')) {
      const match = COUNTRIES.slice()
        .sort((a, b) => b.dialCode.length - a.dialCode.length)
        .find((c) => rawVal.startsWith(c.dialCode));
      if (match) {
        setSelectedCountry(match);
        const rest = rawVal.slice(match.dialCode.length).replace(/[^\d]/g, '');
        setLocalNumber(rest);
        onChange?.(`${match.dialCode}${rest}`);
        return;
      }
    }

    const clean = rawVal.replace(/[^\d\s-]/g, '');
    setLocalNumber(clean);
    const cleanDigits = clean.replace(/[^\d]/g, '');
    const combined = cleanDigits ? `${selectedCountry.dialCode}${cleanDigits}` : '';
    onChange?.(combined);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className={`flex items-center rounded-xl border bg-white transition-colors overflow-hidden ${
          error ? 'border-red-500' : 'border-[#E7E2D9] focus-within:border-[#C2691C]'
        }`}
      >
        {/* Country Code Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="flex items-center gap-1.5 px-3.5 py-3.5 bg-[#FAF8F5] border-r border-[#E7E2D9] hover:bg-[#F3EFE9] transition-colors cursor-pointer select-none text-sm font-medium text-[#1A1A1A] shrink-0"
        >
          <span className="text-lg leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
            {selectedCountry.dialCode}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 text-[#7A746B] transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {/* National Phone Number Input */}
        <input
          ref={numberInputRef}
          type="tel"
          id={id}
          name="phone"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="w-full px-4 py-3.5 text-sm text-[#1A1A1A] placeholder-[#9A948B] outline-none bg-transparent"
        />
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 top-full mt-1.5 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-[#E7E2D9] overflow-hidden"
        >
          {/* Search Box */}
          <div className="p-2.5 border-b border-[#EAE5DE] bg-[#FAF8F5]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A948B]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E7E2D9] bg-white text-[#1A1A1A] placeholder-[#9A948B] outline-none focus:border-[#C2691C]"
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-60 overflow-y-auto py-1 divide-y divide-[#F5F2ED]">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors hover:bg-[#FAF8F5] cursor-pointer ${
                      isSelected ? 'bg-[#F9F5EE] font-semibold text-[#C2691C]' : 'text-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-base leading-none shrink-0" role="img" aria-label={c.name}>
                        {c.flag}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#7A746B] shrink-0">
                      {c.dialCode}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-[#9A948B]">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
