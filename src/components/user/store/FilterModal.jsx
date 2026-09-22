"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function FilterModal({ isOpen, currentSortOption, onApply, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#1E1E1E] border border-white/10 rounded-t-[30px] sm:rounded-3xl p-6 pb-8 sm:pb-6 shadow-2xl text-white safe-area-pb"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Bar Handle */}
        <div className="sm:hidden w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Sort By</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-white/70 hover:text-white"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { value: 'Popularity', label: 'Best Sellers' },
            { value: 'NameAtoZ', label: 'Name: A to Z' },
            { value: 'None', label: 'Default Order' }
          ].map((opt) => {
            const isSelected = currentSortOption === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onApply(opt.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFD3AC] text-[#1E1E1E] font-semibold shadow-md'
                    : 'bg-[#2D2D30] text-white hover:bg-[#38383c]'
                }`}
              >
                <span className="text-base">{opt.label}</span>
                {isSelected && <CheckIcon className="w-5 h-5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
