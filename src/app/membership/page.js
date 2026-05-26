"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/common/Button';
import VideoBackground from '@/components/common/VideoBackground';
import Navigation from '@/components/navigation/Navigation';
import { sectionTitleClasses, bannerTitleClasses } from '@/lib/styles/constants';
import Footer from '@/components/common/Footer';

export default function Membership() {
  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Icons */}
      <section className="relative overflow-hidden">
        {/* Video Background */}
        <VideoBackground />

        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative z-20">
          {/* Banner Content */}
          <div className="pt-24 sm:pt-50 pb-6">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-16">
                <div className="max-w-3xl">
                  <div className={bannerTitleClasses + " mb-4 leading-tight"} style={{ color: 'white' }}>
                    Your Wellness. Fully Covered.
                  </div>
                  <p className="text-white mb-8 text-base sm:text-lg md:text-xl font-light" style={{ color: 'white' }}>
                    Unlimited care. One monthly price.
                  </p>

                  <Link href="/signup" className="px-[52px] sm:px-20 py-3 rounded-full text-sm sm:text-base leading-tight font-medium transition-all duration-200 text-center inline-block bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white cursor-pointer">
                    BOOK FREE<br /> CONSULT NOW
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Three Features Circles */}
          <div className="py-8 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Desktop view - grid */}
              <div className="hidden md:grid grid-cols-3 gap-6 md:gap-8">
                {/* 1:1 Video Sessions */}
                <div className="flex justify-center">
                  <div className="bg-[#FFD3AC] rounded-full w-96 h-96 p-10 flex flex-col items-center justify-center text-center">
                    <div className="mb-4 w-16 h-16 relative">
                      <Image src="/images/icons/video_sessions.png" alt="Video Sessions" fill className="object-contain" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#353535' }}>
                      1:1 Video Sessions with Your Specialist
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#353535' }}>
                      Each month, you&apos;ll connect face-to-face with your personal integrative doctor. You can also choose to consult with other practitioners from our multidisciplinary team
                    </p>
                  </div>
                </div>

                {/* Unlimited Text Access */}
                <div className="flex justify-center">
                  <div className="bg-[#FFD3AC] rounded-full w-96 h-96 p-10 flex flex-col items-center justify-center text-center">
                    <div className="mb-4 w-16 h-16 relative">
                      <Image src="/images/icons/unlimited_text.png" alt="Unlimited Text" fill className="object-contain" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#353535' }}>
                      Unlimited Text Access to Practitioners
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#353535' }}>
                      Have a question mid-week? Feeling off after travel? Message us anytime. You&apos;ll have open chat access with our practitioner team throughout the month so you&apos;re never left in the dark.
                    </p>
                  </div>
                </div>

                {/* Practitioner Collaboration */}
                <div className="flex justify-center">
                  <div className="bg-[#FFD3AC] rounded-full w-96 h-96 p-10 flex flex-col items-center justify-center text-center">
                    <div className="mb-4 w-16 h-16 relative">
                      <Image src="/images/icons/practitioner_collaboration.png" alt="Practitioner Collaboration" fill className="object-contain" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3" style={{ color: '#353535' }}>
                      Practitioner Collaboration, Powered by Real-Time Data
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#353535' }}>
                      Our practitioners don&apos;t work in silos. They communicate behind the scenes, sharing notes and insights to give you a 360° experience. Your wellness doesn&apos;t stop at the first call — and neither do we.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile view - carousel with arrows */}
              <div className="md:hidden">
                <div className="flex items-center gap-2">
                  {/* Left Arrow */}
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('feature-scroll');
                      scrollContainer.scrollBy({ left: -320, behavior: 'smooth' });
                    }}
                    className="flex-shrink-0"
                    aria-label="Previous feature"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>

                  {/* Scrollable Container */}
                  <div className="flex-1 overflow-hidden">
                    <div
                      id="feature-scroll"
                      className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: { display: 'none' } }}
                    >
                      {/* 1:1 Video Sessions */}
                      <div className="flex-none w-full flex justify-center snap-center">
                        <div className="bg-[#FFD3AC] rounded-full w-80 h-80 p-8 flex flex-col items-center justify-center text-center">
                          <div className="mb-4 w-16 h-16 relative">
                            <Image src="/images/icons/video_sessions.png" alt="Video Sessions" fill className="object-contain" />
                          </div>
                          <h3 className="text-lg font-semibold mb-3" style={{ color: '#353535' }}>
                            1:1 Video Sessions with Your Specialist
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: '#353535' }}>
                            Each month, you&apos;ll connect face-to-face with your personal integrative doctor. You can also choose to consult with other practitioners from our multidisciplinary team
                          </p>
                        </div>
                      </div>

                      {/* Unlimited Text Access */}
                      <div className="flex-none w-full flex justify-center snap-center">
                        <div className="bg-[#FFD3AC] rounded-full w-80 h-80 p-8 flex flex-col items-center justify-center text-center">
                          <div className="mb-4 w-16 h-16 relative">
                            <Image src="/images/icons/unlimited_text.png" alt="Unlimited Text" fill className="object-contain" />
                          </div>
                          <h3 className="text-lg font-semibold mb-3" style={{ color: '#353535' }}>
                            Unlimited Text Access to Practitioners
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: '#353535' }}>
                            Have a question mid-week? Feeling off after travel? Message us anytime. You&apos;ll have open chat access with our practitioner team throughout the month so you&apos;re never left in the dark.
                          </p>
                        </div>
                      </div>

                      {/* Practitioner Collaboration */}
                      <div className="flex-none w-full flex justify-center snap-center">
                        <div className="bg-[#FFD3AC] rounded-full w-80 h-80 p-8 flex flex-col items-center justify-center text-center">
                          <div className="mb-4 w-16 h-16 relative">
                            <Image src="/images/icons/practitioner_collaboration.png" alt="Practitioner Collaboration" fill className="object-contain" />
                          </div>
                          <h3 className="text-lg font-semibold mb-3" style={{ color: '#353535' }}>
                            Practitioner Collaboration, Powered by Real-Time Data
                          </h3>
                          <p className="text-sm leading-relaxed" style={{ color: '#353535' }}>
                            Our practitioners don&apos;t work in silos. They communicate behind the scenes, sharing notes and insights to give you a 360° experience. Your wellness doesn&apos;t stop at the first call — and neither do we.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('feature-scroll');
                      scrollContainer.scrollBy({ left: 320, behavior: 'smooth' });
                    }}
                    className="flex-shrink-0"
                    aria-label="Next feature"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Icons Section - Copied from home page */}
          <div className="pb-8 sm:pb-10 md:pb-12">
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              <div className="mb-8 sm:mb-10 px-4">
                {/* Desktop view - grid */}
                <div className="hidden sm:grid grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto">
                  {/* Skin & Hair */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/skin_hair.png" alt="Skin & Hair" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Skin & Hair</p>
                  </div>

                  {/* Women's Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/womens_health.png" alt="Women&apos;s Health" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Women&apos;s Health</p>
                  </div>

                  {/* Men's Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/mens_health.png" alt="Men&apos;s Health" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Men&apos;s Health</p>
                  </div>

                  {/* Digestive Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/digestive_health.png" alt="Digestive Health" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Digestive Health</p>
                  </div>

                  {/* Musculoskeletal */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/musculoskeletal.png" alt="Musculoskeletal" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Musculoskeletal</p>
                  </div>

                  {/* Mental Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/mental_health.png" alt="Mental Health" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Mental Health</p>
                  </div>

                  {/* Longevity */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/longevity.png" alt="Longevity" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Longevity</p>
                  </div>

                  {/* Weight Management */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/weight_mgmt.png" alt="Weight Management" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Weight<br />Management</p>
                  </div>

                  {/* Hormone Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/hormone_health.png" alt="Hormone Health" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Hormone<br />Health</p>
                  </div>

                  {/* Wellness Guides */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image src="/images/icons/wellness_guides.png" alt="Wellness Guides" fill className="object-contain" />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Wellness<br />Guides</p>
                  </div>
                </div>

                {/* Mobile view - horizontal scroll with arrows */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-2">
                    {/* Left Arrow */}
                    <button
                      onClick={() => {
                        const scrollContainer = document.getElementById('icon-scroll');
                        scrollContainer.scrollBy({ left: -200, behavior: 'smooth' });
                      }}
                      className="flex-shrink-0"
                      aria-label="Previous icon"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    {/* Scrollable Container */}
                    <div className="flex-1 overflow-hidden">
                      <div
                        id="icon-scroll"
                        className="flex gap-3 overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: { display: 'none' } }}
                      >
                        {/* All 10 icons repeated for mobile */}
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/skin_hair.png" alt="Skin & Hair" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Skin & Hair</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/womens_health.png" alt="Women&apos;s Health" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Women&apos;s Health</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/mens_health.png" alt="Men&apos;s Health" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Men&apos;s Health</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/digestive_health.png" alt="Digestive Health" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Digestive Health</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/musculoskeletal.png" alt="Musculoskeletal" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Musculoskeletal</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/mental_health.png" alt="Mental Health" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Mental Health</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/longevity.png" alt="Longevity" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Longevity</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/weight_mgmt.png" alt="Weight Management" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Weight<br />Management</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/hormone_health.png" alt="Hormone Health" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Hormone<br />Health</p>
                        </div>
                        <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 flex-shrink-0">
                          <div className="w-10 h-10 mb-1 relative">
                            <Image src="/images/icons/wellness_guides.png" alt="Wellness Guides" fill className="object-contain" />
                          </div>
                          <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Wellness<br />Guides</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Arrow */}
                    <button
                      onClick={() => {
                        const scrollContainer = document.getElementById('icon-scroll');
                        scrollContainer.scrollBy({ left: 200, behavior: 'smooth' });
                      }}
                      className="flex-shrink-0"
                      aria-label="Next icon"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* No Surprises Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="text-center">
            <div className={sectionTitleClasses + " mb-6 sm:mb-8 text-2xl sm:text-3xl md:text-4xl"}>
              No Surprises. Just Results
            </div>
            <p className="text-base sm:text-lg px-4 sm:px-8 md:px-0" style={{ color: '#535353' }}>
              Most wellness programs leave you with costly supplements and little support. We include everything you need so you can focus on feeling your best.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
            {/* Left Column - Membership */}
            <div className="w-full lg:flex-1">
              <div className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl text-center" style={{ color: '#353535' }}>
                Membership
              </div>

              {/* Ambe Membership Card */}
              <div
                className="rounded-2xl mb-8 pt-4 sm:pt-6 max-w-md mx-auto lg:max-w-none"
                style={{ backgroundColor: 'white' }}
              >
                {/* Peach Header */}
                <div
                  className="p-5 sm:p-6 mx-4 sm:mx-6 mb-3 sm:mb-4 text-center"
                  style={{ backgroundColor: '#FFD3AC' }}
                >
                  <div className="text-xl sm:text-2xl font-medium" style={{ color: '#353535' }}>
                    $50 A Month
                  </div>
                  <div className="text-sm mt-1" style={{ color: '#535353' }}>
                    3-month minimum commitment
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>One-hour video call monthly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>Unlimited text</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>Personalized protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>All recommended remedies included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>Bath, body, food, and tea products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>20%+ discount on additional products</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Pay As You Like */}
            <div className="w-full lg:flex-1">
              <div className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl text-center" style={{ color: '#353535' }}>
                Pay As You Like
              </div>

              {/* Pay As You Like Card - Duplicated from Membership */}
              <div
                className="rounded-2xl mb-8 pt-4 sm:pt-6 max-w-md mx-auto lg:max-w-none"
                style={{ backgroundColor: 'white' }}
              >
                {/* Peach Header */}
                <div
                  className="p-5 sm:p-6 mx-4 sm:mx-6 mb-3 sm:mb-4 text-center"
                  style={{ backgroundColor: '#FFD3AC' }}
                >
                  <div className="text-xl sm:text-2xl font-medium" style={{ color: '#353535' }}>
                    Flexible care on your terms.
                  </div>

                </div>

                {/* Features List - Only 3 items with placeholder spacing */}
                <div className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>Personalized protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>Recommended remedies, not all included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#535353' }}>Bath, body, food, and tea products</span>
                  </div>
                  {/* Invisible placeholders to match left column height */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#FFD3AC' }}
                    >
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>
                        ✓
                      </span>
                    </div>
                    <span style={{ color: '#535353' }}>
                      Book individual consultations
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#FFD3AC' }}
                    >
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>
                        ✓
                      </span>
                    </div>
                    <span style={{ color: '#535353' }}>
                      No minimum commitment
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#FFD3AC' }}
                    >
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>
                        ✓
                      </span>
                    </div>
                    <span style={{ color: '#535353' }}>
                      Supplements purchased separately
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          {/* Desktop View */}
          <div className="hidden lg:block">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div></div>
              <div className="text-center font-medium" style={{ color: '#353535' }}>
                Ambé Membership
              </div>
              <div className="text-center font-medium" style={{ color: '#353535' }}>
                Typical Wellness Programs
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-4">
              {/* Video Consults */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Video Consults
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-sm" style={{ color: '#353535' }}>1 hr/month included</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>X</span>
                </div>
              </div>

              {/* Unlimited Text Support */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Unlimited Text Support
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>✓</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>X</span>
                </div>
              </div>

              {/* Personalized Remedies Included */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Personalized Remedies Included
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>✓</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>X</span>
                </div>
              </div>

              {/* Cost of Remedies */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Cost of Remedies
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>$50</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span className="text-sm" style={{ color: '#535353' }}>$350-$1200/mo</span>
                </div>
              </div>

              {/* Additional Product Discounts */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Additional Product Discounts
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>20%+ off</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>Full Retail Price</span>
                </div>
              </div>

              {/* Bath/Body/Food/Tea Products */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Bath/Body/Food/Tea Products
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>Included</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>X</span>
                </div>
              </div>

              {/* Focus on Prevention */}
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Focus on Prevention
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>✓</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>X</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet View - Swipeable Grid */}
          <div className="lg:hidden overflow-x-auto">
            <div className="min-w-[600px] pb-4">
              {/* Column Headers */}
              <div className="grid grid-cols-3 gap-4 mb-6 sticky top-0 bg-[#F4F4F4] z-10 pb-2">
                <div></div>
                <div className="text-center font-medium text-sm" style={{ color: '#353535' }}>
                  Ambé Membership
                </div>
                <div className="text-center font-medium text-sm" style={{ color: '#353535' }}>
                  Typical Wellness Programs
                </div>
              </div>

              {/* Comparison Rows */}
              <div className="space-y-3">
                {/* Video Consults */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Video Consults
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center px-2" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-xs text-center" style={{ color: '#353535' }}>1 hr/month included</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                    <span className="text-sm" style={{ color: '#535353' }}>X</span>
                  </div>
                </div>

                {/* Unlimited Text Support */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Unlimited Text Support
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-sm" style={{ color: '#353535' }}>✓</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                    <span className="text-sm" style={{ color: '#535353' }}>X</span>
                  </div>
                </div>

                {/* Personalized Remedies Included */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Personalized Remedies Included
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-sm" style={{ color: '#353535' }}>✓</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                    <span className="text-sm" style={{ color: '#535353' }}>X</span>
                  </div>
                </div>

                {/* Cost of Remedies */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Cost of Remedies
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center px-2" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-sm" style={{ color: '#353535' }}>$50</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center px-2" style={{ backgroundColor: 'white' }}>
                    <span className="text-xs text-center" style={{ color: '#535353' }}>$350-$1200/mo</span>
                  </div>
                </div>

                {/* Additional Product Discounts */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Additional Product Discounts
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-sm" style={{ color: '#353535' }}>20%+ off</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center px-2" style={{ backgroundColor: 'white' }}>
                    <span className="text-xs text-center" style={{ color: '#535353' }}>Full Retail Price</span>
                  </div>
                </div>

                {/* Bath/Body/Food/Tea Products */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Bath/Body/Food/Tea Products
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-sm" style={{ color: '#353535' }}>Included</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                    <span className="text-sm" style={{ color: '#535353' }}>X</span>
                  </div>
                </div>

                {/* Focus on Prevention */}
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="font-medium text-sm" style={{ color: '#353535' }}>
                    Focus on Prevention
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                    <span className="text-sm" style={{ color: '#353535' }}>✓</span>
                  </div>
                  <div className="h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                    <span className="text-sm" style={{ color: '#535353' }}>X</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Comparison Section - Copied from Homepage */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Desktop Grid View */}
          <div className="hidden lg:block overflow-x-auto">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-0">
              <div className="h-12 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                <span className="font-bold text-xl" style={{ color: '#353535' }}>Feature/Training Area</span>
              </div>
              <div className="h-12 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                <span className="font-bold text-xl" style={{ color: '#353535' }}>Nutritionist</span>
              </div>
              <div className="h-12 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                <span className="font-bold text-xl" style={{ color: '#353535' }}>Registered Dietitian (RD)</span>
              </div>
              <div className="h-12 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                <span className="font-bold text-xl" style={{ color: '#353535' }}>Ayurvedic Doctor</span>
              </div>
            </div>

            {/* Data Rows */}
            <div className="grid grid-cols-4 gap-0">
              {/* Educational Pathway */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Educational Pathway</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Varies widely (certificate to degree)</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Accredited BS/MS in Dietetics + 1200+ hrs supervised practice</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>5.5-year degree (BAMS) or equivalent, with internship in Ayurveda</span>
              </div>

              {/* Governing Body */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Governing Body / License</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>None or limited (not legally protected)</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Licensed by CDR (Commission on Dietetic Registration)</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Licensed by Ayurvedic Medical Boards (India and some global orgs)</span>
              </div>
              {/* Focus of Training */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Focus of Training</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>General nutrition, food science</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Clinical nutrition, disease-related dietary plans</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Mind-body-spirit nutrition, doshas, digestion, daily/life cycles (Dinacharya/Ritucharya)</span>
              </div>
              {/* Training in Herbs */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Training in Herbs & Botanicals</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Minimal to none</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Minimal (only within supplement guidelines)</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Extensive—hundreds of hours in herbal pharmacology, rasa, virya, vipaka</span>
              </div>
              {/* View of Food */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>View of Food</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Macronutrients & calories</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Macronutrient & micronutrient balance; pathology-based</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Food as medicine (Ahara), categorized by qualities, energetics, season, emotional effects</span>
              </div>
              {/* Personalization */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Personalization Approach</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Generic plans or macro-based diets</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Personalized to medical conditions</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Deeply individualized based on prakriti, vikriti, agni, and mental/emotional state</span>
              </div>
              {/* Understanding Digestion */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Understanding of Digestion</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Caloric intake, GI health (basic)</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Detailed GI pathologies, fiber, enzyme responses</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Agni theory, ama (toxicity), 13 types of digestive fire, subtle body digestion</span>
              </div>
              {/* Mind-Body Integration */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Mind-Body Integration</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Rarely addressed</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Minimal integration</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Central to diagnosis and treatment—mental gunas, emotional causation of imbalance</span>
              </div>
              {/* Spiritual Lens */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Spiritual/Ethical Lens</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Not included</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Not included</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Rooted in Vedic philosophy, karma, and ethics; food impacts consciousness</span>
              </div>
              {/* Treatment Modalities */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Treatment Modalities</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Diet plans, calorie tracking</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Medical nutrition therapy</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Food therapy + herbs, lifestyle routines, detox (Panchakarma), breath, meditation, rituals</span>
              </div>
              {/* Scope of Practice */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Scope of Practice</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Wellness support</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Disease prevention & management</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Holistic care across mental, physical, and spiritual domains</span>
              </div>
              {/* Time-Tested Tradition */}
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#353535' }}>Time-Tested Tradition</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Modern (~50-100 years of development)</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Scientific framework from 20th century</span>
              </div>
              <div className="h-14 border flex items-center px-4" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                <span className="text-base leading-none" style={{ color: '#535353' }}>Over 5,000 years of lineage-tested protocols</span>
              </div>
            </div>
          </div>

          {/* Mobile View - 2 columns at a time with swipe navigation */}
          <div className="lg:hidden">
            <div
              className="relative overflow-hidden touch-pan-x"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                e.currentTarget.dataset.startX = touch.clientX;
                const scrollElement = document.getElementById('prof-comparison-scroll');
                const currentTransform = scrollElement.style.transform;
                const currentPercentage = parseFloat(currentTransform.match(/-?\d+/)?.[0] || '0');
                e.currentTarget.dataset.startTransform = currentPercentage;
              }}
              onTouchMove={(e) => {
                if (!e.currentTarget.dataset.startX) return;
                const touch = e.touches[0];
                const startX = parseFloat(e.currentTarget.dataset.startX);
                const startTransform = parseFloat(e.currentTarget.dataset.startTransform);
                const diff = touch.clientX - startX;
                // Convert pixel difference to percentage
                const percentageShift = (diff / window.innerWidth) * 100;
                let newPercentage = startTransform + percentageShift;
                // Limit: can't scroll right past 0%, can't scroll left past -100% (2 views)
                newPercentage = Math.max(-100, Math.min(0, newPercentage));
                const scrollElement = document.getElementById('prof-comparison-scroll');
                scrollElement.style.transform = `translateX(${newPercentage}%)`;
                // Update dots
                const dots = e.currentTarget.querySelectorAll('.prof-dot');
                const activeIndex = Math.round(Math.abs(newPercentage) / 100);
                dots.forEach((dot, i) => {
                  dot.style.backgroundColor = i === activeIndex ? '#353535' : '#D0D0D0';
                });
              }}
              onTouchEnd={(e) => {
                // Snap to nearest view
                const scrollElement = document.getElementById('prof-comparison-scroll');
                const currentTransform = scrollElement.style.transform;
                const currentPercentage = parseFloat(currentTransform.match(/-?\d+/)?.[0] || '0');
                // Round to nearest 100% increment
                const snappedPercentage = Math.round(currentPercentage / 100) * 100;
                scrollElement.style.transform = `translateX(${snappedPercentage}%)`;
                // Update dots
                const dots = e.currentTarget.querySelectorAll('.prof-dot');
                const activeIndex = Math.round(Math.abs(snappedPercentage) / 100);
                dots.forEach((dot, i) => {
                  dot.style.backgroundColor = i === activeIndex ? '#353535' : '#D0D0D0';
                });
                delete e.currentTarget.dataset.startX;
                delete e.currentTarget.dataset.startTransform;
              }}
            >
              <div
                id="prof-comparison-scroll"
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: 'translateX(0%)' }}
              >
                {/* First 2 columns */}
                <div className="flex-none w-full">
                  <div className="grid grid-cols-2 gap-0">
                    {/* Headers */}
                    <div className="h-10 border flex items-center px-2" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                      <span className="font-bold text-base" style={{ color: '#353535' }}>Feature/Training</span>
                    </div>
                    <div className="h-10 border flex items-center px-2" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                      <span className="font-bold text-base" style={{ color: '#353535' }}>Nutritionist</span>
                    </div>

                    {/* Educational Pathway */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Educational Pathway</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Varies widely (certificate to degree)</span>
                    </div>

                    {/* Governing Body */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Governing Body / License</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>None or limited (not legally protected)</span>
                    </div>

                    {/* Focus of Training */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Focus of Training</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>General nutrition, food science</span>
                    </div>

                    {/* Training in Herbs */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Training in Herbs & Botanicals</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Minimal to none</span>
                    </div>

                    {/* View of Food */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>View of Food</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Macronutrients & calories</span>
                    </div>

                    {/* Personalization */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Personalization Approach</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Generic plans or macro-based diets</span>
                    </div>

                    {/* Understanding Digestion */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Understanding of Digestion</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Caloric intake, GI health (basic)</span>
                    </div>

                    {/* Mind-Body Integration */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Mind-Body Integration</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Rarely addressed</span>
                    </div>

                    {/* Spiritual Lens */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Spiritual/Ethical Lens</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Not included</span>
                    </div>

                    {/* Treatment Modalities */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Treatment Modalities</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Diet plans, calorie tracking</span>
                    </div>

                    {/* Scope of Practice */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Scope of Practice</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Wellness support</span>
                    </div>

                    {/* Time-Tested Tradition */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#353535' }}>Time-Tested Tradition</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Modern (~50-100 years)</span>
                    </div>
                  </div>
                </div>

                {/* Second 2 columns */}
                <div className="flex-none w-full">
                  <div className="grid grid-cols-2 gap-0">
                    {/* Headers */}
                    <div className="h-10 border flex items-center px-2" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                      <span className="font-bold text-base" style={{ color: '#353535' }}>Registered Dietitian</span>
                    </div>
                    <div className="h-10 border flex items-center px-2" style={{ backgroundColor: '#FFD3AC', borderColor: '#F5B880' }}>
                      <span className="font-bold text-base" style={{ color: '#353535' }}>Ayurvedic Doctor</span>
                    </div>

                    {/* Educational Pathway */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Accredited BS/MS + 1200+ hrs practice</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>5.5-year BAMS degree</span>
                    </div>

                    {/* Governing Body */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Licensed by CDR</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Ayurvedic Medical Boards</span>
                    </div>

                    {/* Focus of Training */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Clinical nutrition, disease plans</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Mind-body-spirit, doshas</span>
                    </div>

                    {/* Training in Herbs */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Minimal (supplements only)</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Extensive herbal training</span>
                    </div>

                    {/* View of Food */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Macro & micronutrients</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Food as medicine (Ahara)</span>
                    </div>

                    {/* Personalization */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Medical conditions based</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#F4F4F4', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Prakriti, vikriti, agni based</span>
                    </div>

                    {/* Understanding Digestion */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>GI pathologies, enzymes</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Agni theory, 13 digestive fires</span>
                    </div>

                    {/* Mind-Body Integration */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Minimal integration</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Central to treatment</span>
                    </div>

                    {/* Spiritual Lens */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Not included</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Vedic philosophy, karma</span>
                    </div>

                    {/* Treatment Modalities */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Medical nutrition therapy</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Food, herbs, lifestyle, detox</span>
                    </div>

                    {/* Scope of Practice */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Disease prevention/mgmt</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>Holistic care all domains</span>
                    </div>

                    {/* Time-Tested Tradition */}
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>20th century framework</span>
                    </div>
                    <div className="h-14 border flex items-center px-2" style={{ backgroundColor: '#EDEDED', borderColor: '#F5B880' }}>
                      <span className="text-sm leading-tight" style={{ color: '#535353' }}>5,000+ years lineage</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dots Navigation */}
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    document.getElementById('prof-comparison-scroll').style.transform = 'translateX(0%)';
                    const dots = document.querySelectorAll('.prof-dot');
                    dots.forEach((dot, i) => {
                      dot.style.backgroundColor = i === 0 ? '#353535' : '#D0D0D0';
                    });
                  }}
                  className="w-2 h-2 rounded-full transition-colors prof-dot"
                  style={{ backgroundColor: '#353535' }}
                />
                <button
                  onClick={() => {
                    document.getElementById('prof-comparison-scroll').style.transform = 'translateX(-100%)';
                    const dots = document.querySelectorAll('.prof-dot');
                    dots.forEach((dot, i) => {
                      dot.style.backgroundColor = i === 1 ? '#353535' : '#D0D0D0';
                    });
                  }}
                  className="w-2 h-2 rounded-full transition-colors prof-dot"
                  style={{ backgroundColor: '#D0D0D0' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA and Footer Section with Video Background */}
      <section className="relative">
        <VideoBackground />
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]"></div>
        <div className="relative z-10">
          {/* Ready to Feel Your Best Section */}
          <div className="pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8">
            <div className="max-w-5xl mx-auto px-6 sm:px-8">
              <div
                className="py-8 sm:py-10 px-6 sm:px-8 md:px-12 text-center"
                style={{
                  backgroundColor: 'rgba(244, 244, 244, 0.7)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}
              >
                <div className={sectionTitleClasses + " mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl"}>
                  Ready to Feel Your Best?
                </div>
                <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8" style={{ color: '#535353' }}>
                  Join the Ambé Membership for personalized, all-inclusive care.
                </p>
                <Button href="/signup">
                  BOOK NOW - PAY AS YOU LIKE
                </Button>
              </div>
            </div>
          </div>

          {/* Everyone Deserves Access Text */}
          <div className="text-center pt-6 sm:pt-8 pb-12 sm:pb-16 px-6">
            <p className="text-lg sm:text-xl md:text-2xl" style={{ color: 'white' }}>
              Everyone deserves access to care, no matter their budget
            </p>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </section>

    </div>
  );
}