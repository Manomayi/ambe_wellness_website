"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import WebLayoutWrapper from "@/components/common/WebLayoutWrapper";
import AmbeBackButton from "@/components/common/AmbeBackButton";

export default function UserMembershipPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <WebLayoutWrapper maxWidth="680px">
        <div className="space-y-6 pb-16">
          {/* Sticky Top Bar with Back Button */}
          <div className="sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-3">
              <AmbeBackButton />
              <h1
                className="text-2xl sm:text-3xl font-extrabold text-white"
                style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                }}
              >
                Membership
              </h1>
            </div>
          </div>

          {/* Coming Soon Pill Badge */}
          <div className="w-full py-2.5 rounded-full border-2 border-[#FFD3AC] bg-[#FFD3AC]/10 text-center">
            <span className="text-[#FFD3AC] text-sm font-extrabold tracking-widest uppercase font-sans">
              COMING SOON
            </span>
          </div>

          {/* Subtitle & Headline matching Flutter 1:1 */}
          <div className="text-center space-y-2 pt-2">
            <p className="text-xs sm:text-sm font-semibold text-white tracking-widest uppercase font-sans">
              PERSONALIZED · PROVEN · POWERFUL
            </p>
            <h2
              className="text-3xl sm:text-4xl font-extrabold leading-tight text-white"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              Care that&apos;s{" "}
              <span className="text-[#FFD3AC] italic font-extrabold">
                for everyone
              </span>
            </h2>
          </div>

          {/* Quote Card matching Flutter 1:1 */}
          <div className="p-6 sm:p-8 rounded-[20px] bg-[#1B1A18]/65 border border-white/20 text-center space-y-4">
            <p
              className="text-xl sm:text-2xl font-extrabold italic text-white leading-relaxed"
              style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              }}
            >
              &ldquo;Quality holistic care shouldn&apos;t be a luxury — it should be within reach of everyone.&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl mx-auto font-sans">
              We&apos;re building a membership that makes doctor-led, deeply personal wellness affordable and accessible, no matter your budget. Everyone deserves care that sees the whole person.
            </p>
          </div>

          {/* What Membership Will Include */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-widest uppercase font-sans">
              WHAT MEMBERSHIP WILL INCLUDE
            </h3>

            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/25 flex items-center justify-center text-[#FFD3AC] text-sm font-extrabold flex-shrink-0 mt-0.5">
                  ✦
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white font-sans">
                    Everything included, one price
                  </h4>
                  <p className="text-xs sm:text-sm text-white/70 font-sans mt-0.5">
                    Consultations, remedies, and unlimited messaging with your doctor.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/25 flex items-center justify-center text-[#FFD3AC] text-sm font-extrabold flex-shrink-0 mt-0.5">
                  ♡
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white font-sans">
                    Member pricing on remedies
                  </h4>
                  <p className="text-xs sm:text-sm text-white/70 font-sans mt-0.5">
                    Save on the products your doctor recommends for you.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/25 flex items-center justify-center text-[#FFD3AC] text-sm font-extrabold flex-shrink-0 mt-0.5">
                  ∞
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base text-white font-sans">
                    Care on your terms
                  </h4>
                  <p className="text-xs sm:text-sm text-white/70 font-sans mt-0.5">
                    Ongoing support between visits — never left without guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button & Caption */}
          <div className="pt-4 space-y-3 text-center">
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-4 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] rounded-full font-bold text-sm tracking-wider uppercase transition shadow-lg active:scale-[0.99] cursor-pointer"
            >
              NOTIFY ME WHEN IT&apos;S READY
            </button>
            <p className="text-xs sm:text-sm text-white/70 font-sans">
              We&apos;ll let you know the moment membership opens.
            </p>
          </div>

          {/* Modal */}
          {showModal && (
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
                    onClick={() => setShowModal(false)}
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

