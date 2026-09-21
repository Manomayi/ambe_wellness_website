"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import WebLayoutWrapper from "@/components/common/WebLayoutWrapper";

export default function UserCoursesPage() {
  const router = useRouter();
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <WebLayoutWrapper maxWidth="720px">
        <div className="space-y-6 pb-16">
          {/* Coming Soon Pill Badge */}
          <div>
            <span className="inline-block px-3.5 py-1.5 rounded-full border border-[#FFD3AC]/70 text-[#FFD3AC] text-[11px] font-bold tracking-widest uppercase font-sans">
              COMING SOON
            </span>
          </div>

          {/* Headline matching Flutter 1:1 */}
          <div className="space-y-1">
            <h1
              className="text-3xl sm:text-4xl text-[#FAF7F2] font-semibold leading-tight tracking-tight"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Authentic yoga and<br />meditation classes<br />
              <span className="text-[#FFD3AC] italic font-medium">
                taught by the best in the industry
              </span>
            </h1>
          </div>

          {/* Description Text */}
          <p className="text-[#B5AFA8] text-sm sm:text-[14.5px] leading-relaxed font-sans">
            Private classes from leading specialists in authentic yoga and meditation — the kind rooted in tradition, not the gym. Yoga as it was meant to be: preparation for stillness, taught by those who&apos;ve devoted their lives to it.
          </p>

          {/* Pay As You Can Card */}
          <div className="w-full p-5 sm:p-6 rounded-[20px] bg-[#1B1A18]/65 border border-[#FFD3AC]/50 space-y-2.5">
            <h3
              className="text-xl sm:text-2xl font-semibold italic text-[#FFD3AC]"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Pay as you can
            </h3>
            <p className="text-xs sm:text-[13.5px] text-[#B5AFA8] leading-relaxed font-sans">
              Every class is accessible to everyone within their budget. We believe this practice belongs to everyone — not behind a paywall.
            </p>
          </div>

          {/* Live Classes & On Demand Side-by-Side Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-[20px] bg-[#1B1A18]/65 border border-white/12 space-y-2">
              <h4 className="text-white font-bold text-base font-sans">
                Live Classes
              </h4>
              <p className="text-xs sm:text-[13px] text-[#B5AFA8] leading-relaxed font-sans">
                Join specialists in real time, together with the community.
              </p>
            </div>

            <div
              onClick={() => router.push("/user/courses/on-demand")}
              className="p-5 rounded-[20px] bg-[#1B1A18]/65 border border-white/12 space-y-2 cursor-pointer transition-all duration-200 hover:border-[#FFD3AC]/60 hover:bg-[#1B1A18]/85 group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold text-base font-sans group-hover:text-[#FFD3AC] transition-colors">
                  On Demand
                </h4>
                <span className="text-[#FFD3AC] text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-[#B5AFA8] leading-relaxed font-sans">
                Pre-recorded sessions to practice anytime, at your pace.
              </p>
            </div>
          </div>

          {/* Section Header: A preview of what's coming */}
          <div className="pt-2">
            <h2
              className="text-xl sm:text-2xl font-medium italic text-[#E8E2D8] mb-3.5"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              A preview of what&apos;s coming
            </h2>

            <div className="space-y-4">
              {/* Preview Card 1: Stillness for Beginners */}
              <div className="p-5 rounded-[20px] bg-[#1B1A18]/65 border border-white/12 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full border border-[#FFD3AC]/70 text-[#FFD3AC] text-[10px] font-bold tracking-widest uppercase font-sans">
                  MEDITATION
                </span>
                <p className="text-[11px] font-bold tracking-wider text-[#FFD3AC] uppercase font-sans pt-1">
                  WITH A LEADING MEDITATION SPECIALIST
                </p>
                <h3
                  className="text-xl sm:text-2xl font-semibold text-[#F7F4EE]"
                  style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  }}
                >
                  Stillness for Beginners
                </h3>
                <p className="text-xs sm:text-[13px] text-[#B5AFA8] font-sans">
                  Live &amp; On Demand · Clarity &amp; calm
                </p>
              </div>

              {/* Preview Card 2: Traditional Hatha for Meditation */}
              <div className="p-5 rounded-[20px] bg-[#1B1A18]/65 border border-white/12 space-y-2">
                <span className="inline-block px-3 py-1 rounded-full border border-[#FFD3AC]/70 text-[#FFD3AC] text-[10px] font-bold tracking-widest uppercase font-sans">
                  YOGA
                </span>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#FFD3AC] uppercase font-sans pt-1">
                  WITH A LINEAGE-TRAINED YOGA MASTER
                </p>
                <h3
                  className="text-xl sm:text-2xl font-semibold text-[#F7F4EE]"
                  style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  }}
                >
                  Traditional Hatha for Meditation
                </h3>
                <p className="text-xs sm:text-[13px] text-[#B5AFA8] font-sans">
                  Live &amp; On Demand · Preparation for stillness
                </p>
              </div>
            </div>
          </div>

          {/* Bottom CTA Button */}
          <div className="pt-4 space-y-3 text-center">
            <button
              onClick={() => setShowNotifyModal(true)}
              className="w-full py-4 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full font-bold text-sm tracking-wider uppercase transition shadow-lg active:scale-[0.99] cursor-pointer"
            >
              NOTIFY ME WHEN IT&apos;S READY
            </button>
            <p className="text-xs sm:text-sm text-[#B5AFA8] font-sans">
              Be the first to know when classes go live.
            </p>
          </div>

          {/* Coming Soon Modal */}
          {showNotifyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <div className="bg-[#252422] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-4 text-center">
                <h3
                  className="text-2xl font-bold text-white"
                  style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  }}
                >
                  Coming Soon
                </h3>
                <p className="text-sm text-[#B5AFA8] leading-relaxed font-sans">
                  We&apos;ll notify you as soon as this feature becomes available.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowNotifyModal(false)}
                    className="px-6 py-2.5 bg-[#FFD3AC] text-[#1E1E1E] rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#ffe0c4] transition cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
