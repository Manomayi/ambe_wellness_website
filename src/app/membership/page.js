"use client";
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/common/Button';
import VideoBackground from '@/components/common/VideoBackground';
import Navigation from '@/components/navigation/Navigation';
import { sectionTitleClasses, bannerTitleClasses } from '@/lib/styles/constants';
import Footer from '@/components/common/Footer';
import NutritionistTable from '@/components/common/NutritionistTable';
import { CONSULT_HREF } from '@/lib/site-config';

const healthCategories = [
  { icon: "/images/icons/skin_hair.png", label: "Skin & Hair" },
  { icon: "/images/icons/womens_health.png", label: "Women’s Health" },
  { icon: "/images/icons/mens_health.png", label: "Men’s Health" },
  { icon: "/images/icons/digestive_health.png", label: "Digestive Health" },
  { icon: "/images/icons/musculoskeletal.png", label: "Musculoskeletal" },
  { icon: "/images/icons/mental_health.png", label: "Mental Health" },
  { icon: "/images/icons/longevity.png", label: "Longevity" },
  { icon: "/images/icons/weight_mgmt.png", label: "Weight Management" },
  { icon: "/images/icons/hormone_health.png", label: "Hormone Health" },
  { icon: "/images/icons/wellness_guides.png", label: "Wellness Guides" },
];

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
                  {/* Membership is not open yet — mirrors the "Coming Soon"
                      treatment on the mobile app's membership screen. */}
                  <div
                    className="inline-flex items-center justify-center mb-5 px-7 py-2.5 rounded-full border-2 text-sm font-extrabold tracking-wide uppercase"
                    style={{
                      borderColor: '#FFD3AC',
                      color: '#FFD3AC',
                      backgroundColor: 'rgba(255, 211, 172, 0.08)',
                    }}
                  >
                    Coming Soon
                  </div>

                  <div className={bannerTitleClasses + " mb-4 leading-tight"} style={{ color: 'white' }}>
                    Your Wellness. Fully Covered.
                  </div>
                  <p className="text-white mb-8 text-base sm:text-lg md:text-xl font-light" style={{ color: 'white' }}>
                    Unlimited care. One monthly price.
                  </p>

                  <Link
                    href={CONSULT_HREF}
                    className="px-[52px] sm:px-20 py-3 rounded-full text-sm sm:text-base leading-tight font-medium transition-all duration-200 text-center inline-block bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white cursor-pointer"
                  >
                    BOOK FREE<br/> CONSULT NOW
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
                      <Image src="/images/icons/video_sessions.png" alt="Video Sessions" fill className="object-contain brightness-0" />
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
                      <Image src="/images/icons/unlimited_text.png" alt="Unlimited Text" fill className="object-contain brightness-0" />
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
                      <Image src="/images/icons/practitioner_collaboration.png" alt="Practitioner Collaboration" fill className="object-contain brightness-0" />
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
                            <Image src="/images/icons/video_sessions.png" alt="Video Sessions" fill className="object-contain brightness-0" />
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
                            <Image src="/images/icons/unlimited_text.png" alt="Unlimited Text" fill className="object-contain brightness-0" />
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
                            <Image src="/images/icons/practitioner_collaboration.png" alt="Practitioner Collaboration" fill className="object-contain brightness-0" />
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

          {/* Icons Section */}
          <div className="pb-8 sm:pb-10 md:pb-12">
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              <div className="mb-8 sm:mb-10 px-4">
                {/* Desktop view - 10-grid */}
                <div className="hidden lg:grid grid-cols-10 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto">
                  {healthCategories.map((cat) => (
                    <div
                      key={cat.label}
                      className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                        <Image
                          src={cat.icon}
                          alt={cat.label}
                          fill
                          className="object-contain brightness-0"
                        />
                      </div>
                      <p className="text-[11px] text-center text-charcoal leading-[0.9]">
                        {cat.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mobile / Tablet view - auto-scrolling marquee */}
                <div className="lg:hidden overflow-hidden max-w-6xl mx-auto">
                  <div className="flex w-max animate-marquee gap-3 sm:gap-4 md:gap-5">
                    {[...healthCategories, ...healthCategories].map((cat, i) => {
                      const isDuplicate = i >= healthCategories.length;
                      return (
                        <div
                          key={`${cat.label}-${i}`}
                          aria-hidden={isDuplicate ? true : undefined}
                          className="flex-none bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                            <Image
                              src={cat.icon}
                              alt={cat.label}
                              fill
                              className="object-contain brightness-0"
                            />
                          </div>
                          <p className="text-[8px] sm:text-[11px] text-center text-charcoal leading-[0.9]">
                            {cat.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* No Surprises Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F1EA' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="text-center">
            <div className={sectionTitleClasses + " mb-6 sm:mb-8 text-2xl sm:text-3xl md:text-4xl"}>
              No Surprises. Just Results
            </div>
            <p className="text-base sm:text-lg px-4 sm:px-8 md:px-0" style={{ color: '#353535' }}>
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
              <div className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl text-center font-heading" style={{ color: '#353535' }}>
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
                  <p className="text-sm mt-2" style={{ color: '#353535' }}>
                    3-month minimum commitment.
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>One-hour video call monthly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Unlimited text</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Personalized protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>All recommended remedies included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Bath, body, food, and tea products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>20%+ discount on additional products</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Pay as you can */}
            <div className="w-full lg:flex-1">
              <div className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl text-center font-heading" style={{ color: '#353535' }}>
                Pay as you can
              </div>

              {/* Pay as you can card */}
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
                    <span style={{ color: '#353535' }}>Personalized protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Recommended remedies, not all included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Bath, body, food, and tea products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Book individual consultations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>No minimum commitment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFD3AC' }}>
                      <span className="text-[10px] font-black" style={{ color: 'white' }}>✓</span>
                    </div>
                    <span style={{ color: '#353535' }}>Supplements purchased separately</span>
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
                Ambe Membership
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
                <span style={{ color: '#353535' }}>X</span>
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
                <span style={{ color: '#353535' }}>X</span>
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
                <span style={{ color: '#353535' }}>X</span>
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
                <span className="text-sm" style={{ color: '#353535' }}>$350-$1200/mo</span>
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
                <span style={{ color: '#353535' }}>Full Retail Price</span>
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
                <span style={{ color: '#353535' }}>X</span>
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
                  <span style={{ color: '#353535' }}>X</span>
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
                  Ambe Membership
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
                    <span className="text-sm" style={{ color: '#353535' }}>X</span>
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
                    <span className="text-sm" style={{ color: '#353535' }}>X</span>
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
                    <span className="text-sm" style={{ color: '#353535' }}>X</span>
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
                    <span className="text-xs text-center" style={{ color: '#353535' }}>$350-$1200/mo</span>
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
                    <span className="text-xs text-center" style={{ color: '#353535' }}>Full Retail Price</span>
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
                    <span className="text-sm" style={{ color: '#353535' }}>X</span>
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
                    <span className="text-sm" style={{ color: '#353535' }}>X</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional comparison — shares NutritionistTable with the homepage so
          the two can no longer drift apart. Previously a hand-copied duplicate
          with separate desktop and mobile versions. */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F1EA' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <NutritionistTable />
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
                <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8" style={{ color: '#353535' }}>
                  Join the Ambe Membership for personalized, all-inclusive care.
                </p>
                <Button href={CONSULT_HREF}>
                  BOOK NOW - PAY AS YOU CAN
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