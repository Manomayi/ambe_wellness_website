"use client";

import { useState } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import BackButton from '@/components/common/BackButton';

export default function UserMembershipPage() {
  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    setNotified(true);
  };

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <BackButton label="Back" href="/user/menu" />

        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-6 sm:p-10 shadow-sm space-y-8">
          {/* Coming Soon Pill */}
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center px-6 py-2 rounded-full border border-[#C8996A] bg-[#FAF8F5] text-[#C8996A] text-xs font-bold tracking-widest uppercase">
              Coming Soon
            </span>
          </div>

          {/* Heading */}
          <div className="text-center space-y-3">
            <p className="text-xs font-semibold text-[#8C827A] uppercase tracking-widest">
              Personalized · Proven · Powerful
            </p>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1A1A1A]">
              Care that&apos;s <span className="italic text-[#C2691C]">for everyone</span>
            </h1>
          </div>

          {/* Quote Card */}
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <p className="font-serif italic text-lg sm:text-xl text-[#1A1A1A] leading-relaxed">
              &ldquo;Quality holistic care shouldn&apos;t be a luxury — it should be within reach of everyone.&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-[#6B6862] leading-relaxed max-w-xl mx-auto">
              We&apos;re building a membership that makes doctor-led, deeply personal wellness affordable and accessible, no matter your budget. Everyone deserves care that sees the whole person.
            </p>
          </div>

          {/* What Membership Will Include */}
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-[#8C827A] uppercase tracking-wider text-center sm:text-left">
              What Membership Will Include
            </h3>

            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/40 flex items-center justify-center text-[#1A1A1A] flex-shrink-0 font-bold">
                  ✦
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1A1A1A]">Everything included, one price</h4>
                  <p className="text-xs text-[#6B6862] mt-0.5">
                    Consultations, custom remedies, and unlimited messaging with your doctor.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/40 flex items-center justify-center text-[#1A1A1A] flex-shrink-0 font-bold">
                  ♡
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1A1A1A]">Member pricing on remedies</h4>
                  <p className="text-xs text-[#6B6862] mt-0.5">
                    Exclusive discounts on all wellness products your doctor recommends for you.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2D9]">
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/40 flex items-center justify-center text-[#1A1A1A] flex-shrink-0 font-bold">
                  ∞
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#1A1A1A]">Care on your terms</h4>
                  <p className="text-xs text-[#6B6862] mt-0.5">
                    Ongoing support between visits — you are never left without doctor guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 text-center space-y-3">
            {notified ? (
              <div className="p-4 bg-[#2E7D32]/10 border border-[#2E7D32]/30 rounded-xl text-xs text-[#2E7D32] font-semibold">
                ✓ You&apos;re on the list! We will notify you as soon as membership opens.
              </div>
            ) : (
              <button
                onClick={handleNotify}
                className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                Notify me when it&apos;s ready
              </button>
            )}
            <p className="text-xs text-[#8C827A]">
              We&apos;ll let you know the moment membership opens.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
