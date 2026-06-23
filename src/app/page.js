"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/common/Button";
import VideoBackground from "@/components/common/VideoBackground";
import Navigation from "@/components/navigation/Navigation";
import {
  sectionTitleClasses,
  bannerTitleClasses,
} from "@/lib/styles/constants";
import Footer from "@/components/common/Footer";
import StatsBar from "@/components/common/StatsBar";
import ComparisonGrid from "@/components/common/ComparisonGrid";
import BiomarkersAccordion from "@/components/common/BiomarkersAccordion";
import NutritionistTable from "@/components/common/NutritionistTable";
import AppDownload from "@/components/common/AppDownload";
import PricingCallout from "@/components/common/PricingCallout";
import EmailCaptureAutoPrompt from "@/components/common/EmailCaptureAutoPrompt";
import DoctorProfileFinePrint, { MedicalDirectorBadge } from "@/components/common/DoctorProfileFinePrint";
import DoctorProfileModal from "@/components/common/DoctorProfileModal";

// Carousel component for The Ambé Difference section 
function AmbeDifferenceCarousel() {
  const [currentItem, setCurrentItem] = React.useState(0);
  const carouselItems = [
    {
      title: "1. Clinical Precision",
      icon: "/images/icons/clinic.png",
      whatWeDo: "Doctors trained in traditional and Ayurvedic Medicine and allopathic, modern medicine integrative science. Recognize interactions between herbal and pharmaceutical protocols.",
      whyItMatters: "Prevents serious side effects from poor combinations (e.g., SSRIs + Brahmi, beta-blockers + Ashwagandha, blood thinners + turmeric)."
    },
    {
      title: "2. High-Touch Personalization",
      icon: "/images/icons/personalized.png",
      whatWeDo: "Protocols tailored to each individual's dosha, agni (metabolic function), emotional state, lifestyle, and environment.",
      whyItMatters: "Ensures safety, relevance, and long-term sustainability in real-world lifestyles."
    },
    {
      title: "3. No Harmful Cross-Reactions",
      icon: "/images/icons/clinic.png",
      whatWeDo: "Evaluate all regimens for potential interactions with pharmaceuticals and contraindicated therapies.",
      whyItMatters: "Reduces risk of iatrogenic effects seen with unqualified holistic advice or DIY use."
    },
    {
      title: "4. Science-Guided Herbalism",
      icon: "/images/icons/clinic.png",
      whatWeDo: "All formulas third-party tested for purity, potency, microbial safety, heavy metals, and pesticides.",
      whyItMatters: "Offers effective, non-toxic results—especially important for chronic illness or sensitive users."
    },
    {
      title: "5. Regulatory Integrity",
      icon: "/images/icons/clinic.png",
      whatWeDo: "No consultation fees. Practitioners are doctors with added biomedical training—not licensed MDs.",
      whyItMatters: "Maintains legal compliance while delivering high-quality, informed care."
    },
    {
      title: "6. Global Standard Sourcing",
      icon: "/images/icons/clinic.png",
      whatWeDo: "Ingredients sourced from India, South America, Japan, and Europe; meet EU pharmacopeia and ISO benchmarks.",
      whyItMatters: "Surpasses U.S. safety norms; ensures quality and cultural fidelity."
    },
    {
      title: "7. Evidence-Informed Guidance",
      icon: "/images/icons/clinic.png",
      whatWeDo: "Cross-reference Vedic protocols with peer-reviewed science in nutrition, immunology, endocrinology, and mental health.",
      whyItMatters: "Balances tradition with modern science—ideal for skeptical or science-minded individuals."
    },
    {
      title: "8. Access Over Hype",
      icon: "/images/icons/clinic.png",
      whatWeDo: "We don't waste your money on flashy marketing campaigns or expensive packaging. Instead, we invest every dollar where it truly counts-making high-quality wellness support accessible and affordable.",
      whyItMatters: "By keeping our costs lean and our approach honest, we prioritize real care over hype. This means fair pricing, wider reach, and access to personalized, traditional wellness for everyone-without paying extra for marketing fluff"
    }
  ];

  const handlePrev = () => {
    setCurrentItem((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
  };

  const handleNext = () => {
    setCurrentItem((prev) => (prev + 1) % carouselItems.length);
  };

  return (
    <>
      {/* Carousel Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={handlePrev} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="bg-white rounded-full py-3 px-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFD3AC] rounded-full flex items-center justify-center p-2">
              <Image
                src={carouselItems[currentItem].icon}
                alt={carouselItems[currentItem].title}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <span className="font-medium text-base" style={{ color: "#353535" }}>
              {carouselItems[currentItem].title}
            </span>
          </div>
        </div>

        <button onClick={handleNext} className="p-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Content Box - Perfect Circle */}
      <div className="flex justify-center">
        <div className="bg-white rounded-full w-[24rem] h-[24rem] p-10 flex flex-col justify-center text-center">
          <div className="text-lg font-medium mb-4" style={{ color: "#353535" }}>
            {carouselItems[currentItem].title}
          </div>

          <div className="space-y-3">
            <div>
              <div className="font-medium mb-1 text-sm" style={{ color: "#353535" }}>
                What We Do
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#535353" }}>
                {carouselItems[currentItem].whatWeDo}
              </p>
            </div>

            <div>
              <div className="font-medium mb-1 text-sm" style={{ color: "#353535" }}>
                Why It Matters
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#535353" }}>
                {carouselItems[currentItem].whyItMatters}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Home() {
  // Doctor "View Profile" modal state + data (Meet the Experts)
  const [selectedDoctor, setSelectedDoctor] = React.useState(null);
  const doctorList = [
    { name: "Dr. Smita Bhatia", image: "/images/doctors/smita_bhatia.png", specialty: "Oncology Director", isMedicalDirector: true },
    { name: "Dr. Jeremy Stone", image: "/images/doctors/jeremy_stone.png", specialty: "Metabolic and musculoskeletal specialist" },
    { name: "Dr. Anandibai Joshi", image: "/images/doctors/anandibai_joshi.png", specialty: "Psychology specialist" },
    { name: "Dr. Indira Hinduja", image: "/images/doctors/indira_hinduja.png", specialty: "OBGYN and women's health" },
  ];

  // Content data for the Q&A accordion (prose reused from the former tabbed section)
  const tabContent = {
    'labs': {
      title: 'Lab Work & Hormone Health',
      text: "Hormone levels fluctuate significantly from day to day, and throughout a single day at times, which means a single blood test often doesn't reflect the full picture. Rather than relying solely on lab diagnostics, our approach emphasizes symptom patterns, constitutional balance, and energetic signs—what we call iridic insight. We work with your body's rhythms, not just snapshots in time.",
      image: '/images/education/lab_work.png'
    },
    'biomarkers': {
      title: 'Bio markers and holistic integration',
      text: 'Bio markers are often not time tested nor really accurate when it comes to hormones because hormones fluctuate day to day if not hour to hour. We often don\'t catch imbalances or deficiencies until its far advanced and harder to treat. We employ lab bio markers along with time tested methods, often catching imbalance early on.',
      image: '/images/home/hands.png'
    },
    'personalize': {
      title: 'Precision Formulated rooted in You',
      text: 'Every formula is crafted from the ground up using your unique constitution, energetic state, symptoms, and subtle pulse readings. Our doctors blend herbs, minerals, and natural compounds using both ancient rasayana principles and modern botanical intelligence. There are no mass formulations—only tailored wellness.',
      image: '/images/education/precision_formula.png'
    },
    'prevent': {
      title: 'Safe Use Across All Systems',
      text: "We take your pharmaceutical use seriously. Every formula is screened against known herb-drug contraindications using a global reference database. We'll never suggest anything that interferes with your prescriptions. Our doctors are trained in integrative pharmacognosy and will advise gently, with respect for allopathic care plans.",
      image: '/images/education/safe_use.png'
    },
    'mislabeled': {
      title: 'Truth Behind the Labels',
      text: 'Not all "natural" therapies are safe. Many over-the-counter hormone creams or supplements are mislabeled, contain synthetic compounds, or disrupt your endocrine system further. Our team helps you decode marketing hype, guiding you toward real nourishment and away from potentially harmful fads.',
      image: '/images/education/truth_behind.png'
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Email capture modal — auto-shows after 8s on first visit this session */}
      <EmailCaptureAutoPrompt />

      {/* Doctor View Profile modal */}
      <DoctorProfileModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />

      {/* Navigation */}
      <Navigation />

      {/* Hero Section with Trusted By */}
      <section className="relative overflow-hidden">
        {/* Video Background */}
        <VideoBackground />

        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative z-20">
          {/* Original Banner Content */}
          <div className="pt-24 sm:pt-50 pb-6">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-16">
                <div className="max-w-3xl">
                  <div
                    className={bannerTitleClasses + " leading-tight"}
                    style={{ color: "white" }}
                  >
                    Holistic Tele-Wellness
                  </div>
                  <p
                    className="text-white mb-4 text-sm sm:text-base md:text-lg lg:text-xl font-light"
                    style={{ color: "white" }}
                  >
                    Finally Real Doctors Trained In Both Modern Science And
                    <br />
                    Traditional Vedic Medicine.
                  </p>
                  <p
                    className="text-white text-2xl lg:text-3xl font-bold"
                    style={{ color: "white" }}
                  >
                    Pay As You Want
                  </p>
                  <p
                    className="text-white mb-6 text-lg lg:text-xl font-bold"
                    style={{ color: "white" }}
                  >
                    Developed at Stanford
                  </p>

                  <button 
                    className="px-[52px] sm:px-20 py-3 rounded-full text-sm sm:text-base leading-tight font-medium transition-all duration-200 text-center inline-block bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white cursor-pointer"
                  >
                    BOOK FREE<br/> CONSULT NOW
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By Section - Now part of banner */}
          <div className="pb-8 sm:pb-10 md:pb-12">
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              {/* Icons Section */}
              <div className="mb-8 sm:mb-10 px-4">
                {/* Desktop view - grid */}
                <div className="hidden sm:grid grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto">
                  {/* Skin & Hair */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/skin_hair.png"
                        alt="Skin & Hair"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Skin & Hair</p>
                  </Link>
                  
                  {/* Women's Health */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/womens_health.png"
                        alt="Women's Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Women&apos;s Health</p>
                  </Link>
                  
                  {/* Men's Health */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/mens_health.png"
                        alt="Men's Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Men&apos;s Health</p>
                  </Link>
                  
                  {/* Digestive Health */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/digestive_health.png"
                        alt="Digestive Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Digestive Health</p>
                  </Link>
                  
                  {/* Musculoskeletal */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/musculoskeletal.png"
                        alt="Musculoskeletal"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Musculoskeletal</p>
                  </Link>
                  
                  {/* Mental Health */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/mental_health.png"
                        alt="Mental Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Mental Health</p>
                  </Link>
                  
                  {/* Longevity */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/longevity.png"
                        alt="Longevity"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Longevity</p>
                  </Link>
                  
                  {/* Weight Management */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/weight_mgmt.png"
                        alt="Weight Management"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Weight<br/>Management</p>
                  </Link>
                  
                  {/* Hormone Health */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/hormone_health.png"
                        alt="Hormone Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Hormone<br/>Health</p>
                  </Link>
                  
                  {/* Wellness Guides */}
                  <Link href="/membership" className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/wellness_guides.png"
                        alt="Wellness Guides"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-center text-gray-800 leading-[0.9]">Wellness<br/>Guides</p>
                  </Link>
                </div>
                
                {/* Mobile view - scrollable with arrows */}
                <div className="sm:hidden">
                  <div className="flex items-center gap-0">
                    {/* Left Arrow */}
                    <button
                      onClick={() => {
                        const scrollContainer = document.getElementById('icon-scroll');
                        scrollContainer.scrollBy({ left: -332, behavior: 'smooth' });
                      }}
                      className="flex-shrink-0 -ml-4"
                      aria-label="Scroll left"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    
                    <div 
                      id="icon-scroll"
                      className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1 px-2"
                      style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
                    >
                      {/* Skin & Hair */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/skin_hair.png"
                            alt="Skin & Hair"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Skin & Hair</p>
                      </Link>
                      
                      {/* Women's Health */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/womens_health.png"
                            alt="Women's Health"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Women&apos;s Health</p>
                      </Link>
                      
                      {/* Men's Health */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/mens_health.png"
                            alt="Men's Health"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Men&apos;s Health</p>
                      </Link>
                      
                      {/* Digestive Health */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/digestive_health.png"
                            alt="Digestive Health"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Digestive Health</p>
                      </Link>
                      
                      {/* Musculoskeletal */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/musculoskeletal.png"
                            alt="Musculoskeletal"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Musculoskeletal</p>
                      </Link>
                      
                      {/* Mental Health */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/mental_health.png"
                            alt="Mental Health"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Mental Health</p>
                      </Link>
                      
                      {/* Longevity */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/longevity.png"
                            alt="Longevity"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Longevity</p>
                      </Link>
                      
                      {/* Weight Management */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/weight_mgmt.png"
                            alt="Weight Management"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Weight<br/>Management</p>
                      </Link>
                      
                      {/* Hormone Health */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/hormone_health.png"
                            alt="Hormone Health"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Hormone<br/>Health</p>
                      </Link>
                      
                      {/* Wellness Guides */}
                      <Link href="/membership" className="flex-none snap-start bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20">
                        <div className="w-10 h-10 mb-1 relative">
                          <Image
                            src="/images/icons/wellness_guides.png"
                            alt="Wellness Guides"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-[8px] text-center text-gray-800 leading-[0.9]">Wellness<br/>Guides</p>
                      </Link>
                    </div>
                    
                    {/* Right Arrow */}
                    <button
                      onClick={() => {
                        const scrollContainer = document.getElementById('icon-scroll');
                        scrollContainer.scrollBy({ left: 332, behavior: 'smooth' });
                      }}
                      className="flex-shrink-0 -mr-4"
                      aria-label="Scroll right"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-8 sm:mb-12 text-center px-4">
                <div
                  className={
                    sectionTitleClasses +
                    " text-xl xl:text-2xl"
                  }
                  style={{ color: "white" }}
                >
                  Trusted By:
                </div>
                <div
                  className="font-bold mb-2 md:mb-4 text-3xl lg:text-4xl"
                  style={{ color: "white" }}
                >
                  American Apparel™
                </div>
                <p
                  className="text-xs sm:text-base lg:text-lg"
                  style={{ color: "white" }}
                >
                  &quot;Trusted by executives, frontline workers, and families alike&quot;
                </p>
              </div>

              {/* Testimonials Grid - Desktop */}
              <div className="hidden md:flex flex-row justify-center items-center gap-4 sm:gap-6 mb-12 sm:mb-16">
                {/* David Testimonial */}
                <div className="flex justify-center">
                  <div
                    className="rounded-full p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] h-[220px] md:h-[240px] lg:h-[260px] xl:h-[280px]"
                    style={{ backgroundColor: "#FFD3AC" }}
                  >
                    <div className="relative w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden mt-2">
                      <Image
                        src="/images/testimonials/david.png"
                        alt="David"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p
                      className="text-sm text-center leading-relaxed mb-3 px-4"
                      style={{ color: "#353535" }}
                    >
                      &quot;Sharper focus in just weeks. Ambé gave me energy I didn&apos;t know I was missing&quot;
                    </p>
                    <p
                      className="text-sm text-center font-bold mb-1"
                      style={{ color: "#353535" }}
                    >
                      David
                    </p>
                    <p
                      className="text-sm text-center"
                      style={{ color: "#353535" }}
                    >
                      Chief Strategy Officer
                    </p>
                  </div>
                </div>

                {/* Joshua Testimonial */}
                <div className="flex justify-center">
                  <div
                    className="rounded-full p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] h-[220px] md:h-[240px] lg:h-[260px] xl:h-[280px]"
                    style={{ backgroundColor: "#FFD3AC" }}
                  >
                    <div className="relative w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden mt-2">
                      <Image
                        src="/images/testimonials/joshua.png"
                        alt="Joshua"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p
                      className="text-sm text-center leading-relaxed mb-3 px-4"
                      style={{ color: "#353535" }}
                    >
                      &quot;My stress, digestion, and moods leveled out. I finally feel in control.&quot;
                    </p>
                    <p
                      className="text-sm text-center font-bold mb-1"
                      style={{ color: "#353535" }}
                    >
                      Joshua
                    </p>
                    <p
                      className="text-sm text-center"
                      style={{ color: "#353535" }}
                    >
                      Operations Supervisor
                    </p>
                  </div>
                </div>

                {/* Rosario Testimonial */}
                <div className="flex justify-center">
                  <div
                    className="rounded-full p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center w-[220px] md:w-[240px] lg:w-[260px] xl:w-[280px] h-[220px] md:h-[240px] lg:h-[260px] xl:h-[280px]"
                    style={{ backgroundColor: "#FFD3AC" }}
                  >
                    <div className="relative w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden mt-2">
                      <Image
                        src="/images/testimonials/rosario.png"
                        alt="Rosario"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p
                      className="text-sm text-center leading-relaxed mb-3 px-4"
                      style={{ color: "#353535" }}
                    >
                      &quot;Pain stopped ruling me. Ambe helped me reclaim my health with care that feels human.&quot;
                    </p>
                    <p
                      className="text-sm text-center font-bold mb-1"
                      style={{ color: "#353535" }}
                    >
                      Rosario
                    </p>
                    <p
                      className="text-sm text-center"
                      style={{ color: "#353535" }}
                    >
                      Warehouse Associate
                    </p>
                  </div>
                </div>
              </div>

              {/* Testimonials - Mobile with Arrows */}
              <div className="md:hidden mb-6 sm:mb-16">
                <div className="flex items-center justify-center gap-2">
                  {/* Left Arrow */}
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('testimonial-scroll');
                      scrollContainer.scrollBy({ left: -296, behavior: 'smooth' });
                    }}
                    className="flex-shrink-0 p-1"
                    aria-label="Scroll left"
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  
                  <div 
                    id="testimonial-scroll"
                    className="flex gap-4 overflow-x-hidden snap-x snap-mandatory scrollbar-hide"
                    style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch", width: "280px" }}
                  >
                    {/* David Testimonial */}
                    <div className="flex-none snap-center">
                      <div
                        className="rounded-full p-4 flex flex-col items-center justify-center w-[280px] h-[280px]"
                        style={{ backgroundColor: "#FFD3AC" }}
                      >
                        <div className="relative w-16 h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden mt-2">
                          <Image
                            src="/images/testimonials/david.png"
                            alt="David"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p
                          className="text-sm text-center leading-relaxed mb-3 px-4"
                          style={{ color: "#353535" }}
                        >
                          &quot;Sharper focus in just weeks. Ambé gave me energy I didn&apos;t know I was missing&quot;
                        </p>
                        <p
                          className="text-sm text-center font-bold mb-1"
                          style={{ color: "#353535" }}
                        >
                          David
                        </p>
                        <p
                          className="text-xs text-center"
                          style={{ color: "#353535" }}
                        >
                          Chief Strategy Officer
                        </p>
                      </div>
                    </div>

                    {/* Joshua Testimonial */}
                    <div className="flex-none snap-center">
                      <div
                        className="rounded-full p-4 flex flex-col items-center justify-center w-[280px] h-[280px]"
                        style={{ backgroundColor: "#FFD3AC" }}
                      >
                        <div className="relative w-16 h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden mt-2">
                          <Image
                            src="/images/testimonials/joshua.png"
                            alt="Joshua"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p
                          className="text-sm text-center leading-relaxed mb-3 px-4"
                          style={{ color: "#353535" }}
                        >
                          &quot;My stress, digestion, and moods leveled out. I finally feel in control.&quot;
                        </p>
                        <p
                          className="text-sm text-center font-bold mb-1"
                          style={{ color: "#353535" }}
                        >
                          Joshua
                        </p>
                        <p
                          className="text-xs text-center"
                          style={{ color: "#353535" }}
                        >
                          Operations Supervisor
                        </p>
                      </div>
                    </div>

                    {/* Rosario Testimonial */}
                    <div className="flex-none snap-center">
                      <div
                        className="rounded-full p-4 flex flex-col items-center justify-center w-[280px] h-[280px]"
                        style={{ backgroundColor: "#FFD3AC" }}
                      >
                        <div className="relative w-16 h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden mt-2">
                          <Image
                            src="/images/testimonials/rosario.png"
                            alt="Rosario"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p
                          className="text-sm text-center leading-relaxed mb-3 px-4"
                          style={{ color: "#353535" }}
                        >
                          &quot;Pain stopped ruling me. Ambe helped me reclaim my health with care that feels human.&quot;
                        </p>
                        <p
                          className="text-sm text-center font-bold mb-1"
                          style={{ color: "#353535" }}
                        >
                          Rosario
                        </p>
                        <p
                          className="text-xs text-center"
                          style={{ color: "#353535" }}
                        >
                          Warehouse Associate
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Arrow */}
                  <button
                    onClick={() => {
                      const scrollContainer = document.getElementById('testimonial-scroll');
                      scrollContainer.scrollBy({ left: 296, behavior: 'smooth' });
                    }}
                    className="flex-shrink-0 p-1"
                    aria-label="Scroll right"
                  >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Bio-Markers Stats */}
              <div className="text-center px-4">
                <p
                  className="text-xl lg:text-2xl mb-6"
                  style={{ color: "white" }}
                >
                  <span className="font-bold underline">55</span>{" "}
                  <span className="font-light">Million Bio-Markers analysed</span>
                </p>
                
                <Button className="font-bold mb-12 text-sm px-[90px]">BOOK FREE<br/> CONSULT NOW</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <StatsBar />

      {/* Ayurveda Meets Epigenetics Section */}
      <section className="py-16 sm:py-20 md:py-24" style={{ backgroundColor: "#E5E5E5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-12">
            {/* Left Box */}
            <div className="flex-1 bg-white rounded-lg p-6 sm:p-10">
              <div className="text-2xl sm:text-3xl mb-1 font-medium not-italic" style={{ color: "#353535", fontFamily: "Richmond" }}>
                Ayurveda Meets Epigenetics
              </div>
              <div className="text-2xl sm:text-3xl mb-3 font-medium not-italic" style={{ color: "#353535", fontFamily: "Richmond" }}>
                The Future Of Healthcare
              </div>
              <p className="text-sm md:text-base mb-6" style={{ color: "#535353"}}>
                One system has guided humanity for 5,000 years. The other is at
                science&apos;s frontier. Together, they transform what healthcare can be.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full mr-3 flex-shrink-0 mt-0.5" style={{ backgroundColor: "#FFD3AC" }}>
                    <span style={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>✓</span>
                  </span>
                  <p className="text-sm md:text-base" style={{ color: "#535353" }}>
                    Detect potential health issues years — even decades — before
                    symptoms appear.
                  </p>
                </div>
                <div className="flex items-start">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full mr-3 flex-shrink-0 mt-0.5" style={{ backgroundColor: "#FFD3AC" }}>
                    <span style={{ color: "white", fontSize: "12px", fontWeight: "bold" }}>✓</span>
                  </span>
                  <p className="text-sm md:text-base" style={{ color: "#535353" }}>
                    Track in real time how your lifestyle impacts your cellular +
                    mitochondrial health.
                  </p>
                </div>
              </div>
              <p className="text-sm md:text-base" style={{ color: "#353535" }}>
                This isn&apos;t science fiction. This is Ambé.&quot;
              </p>
            </div>

            {/* Right Box - Same height as left */}
            <div className="flex-1 bg-white rounded-lg p-6 md:p-8 sm:p-10 flex flex-col justify-between" style={{ border: "0.5px solid #FFD3AC" }}>
              <div>
                <div className="text-sm md:text-base mb-2 md:mb-4 font-medium not-italic" style={{ color: "#353535", fontFamily: "Richmond" }}>
                  Your DNA Writes The Alphabet Your Epigenetics Write The Story
                </div>
                <p className="text-sm md:text-base mb-4 md:mb-8" style={{ color: "#535353", lineHeight: "1.6" }}>
                  Your genes don&apos;t decide your fate. Epigenetics — your lifestyle,
                  environment, and consciousness — determine which genes switch on or
                  off. That means your health future is in your hands.
                </p>
              </div>

              <div className="p-6 sm:p-8" style={{ backgroundColor: "#FFD3AC", borderTopLeftRadius: "60px", borderBottomRightRadius: "60px" }}>
                <p className="text-sm md:text-base" style={{ color: "#353535", lineHeight: "1.6" }}>
                  &quot;In a twin double blind study , identical twins lived
                  differently for just 8 weeks. The twin measurably
                  lowered their biological age. Same DNA. Different
                  choices. Different future.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Book Free Consult Button - Centered Below */}
          <div className="flex justify-center mt-7 md:mt-12">
            <Button className="font-extrabold">BOOK FREE<br/> CONSULT NOW</Button>
          </div>
        </div>
      </section>

      {/* The Ambé Difference - Mobile Only */}
      <section className="md:hidden py-12" style={{ backgroundColor: "#F4F4F4" }}>
        <div className="container mx-auto px-4">
          <div className="text-3xl text-center mb-8 font-['Richmond'] font-medium" style={{ color: "#353535" }}>
            The Ambé Difference
          </div>

          {/* Three Cards */}
          <div className="space-y-6 mb-12">
            {/* Precision You Can Trust Card */}
            <div className="relative bg-[#FFD3AC] py-7 px-5 pr-10" style={{ borderRadius: "0 80px 0 80px" }}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 p-4">
                  <Image
                    src="/images/icons/trust.png"
                    alt="Trust"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-2" style={{ color: "#353535" }}>
                    Precision You Can Trust
                  </div>
                  <p className="text-sm" style={{ color: "#353535" }}>
                    Doctors cross-trained in time tested and modern science
                  </p>
                </div>
              </div>
            </div>

            {/* Plans crafted around your Card */}
            <div className="relative bg-[#FFD3AC] py-7 px-5 pr-10" style={{ borderRadius: "0 80px 0 80px" }}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 p-4">
                  <Image
                    src="/images/icons/healthcare.png"
                    alt="Healthcare"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-2" style={{ color: "#353535" }}>
                    Plans crafted around your
                  </div>
                  <p className="text-sm" style={{ color: "#353535" }}>
                    Plans crafted around your whole self & labs
                  </p>
                </div>
              </div>
            </div>

            {/* Ethics You Can Stand Behind Card */}
            <div className="relative bg-[#FFD3AC] py-7 px-5 pr-10" style={{ borderRadius: "0 80px 0 80px" }}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 p-4">
                  <Image
                    src="/images/icons/ethics.png"
                    alt="Ethics"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-2" style={{ color: "#353535" }}>
                    Ethics You Can Stand Behind
                  </div>
                  <p className="text-sm" style={{ color: "#353535" }}>
                    Fair-trade sourcing, real transparency
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Carousel with State Management */}
          <AmbeDifferenceCarousel />
        </div>
      </section>

      {/* How We Compare Section - Dark Flat Grid */}
      <section className="py-16 sm:py-20 md:py-24" style={{ backgroundColor: "#1C1C1C" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="text-center text-3xl sm:text-4xl md:text-5xl font-medium mb-4"
            style={{ color: "white", fontFamily: "Richmond" }}
          >
            No Hidden Fees. Ever.
          </div>
          <p
            className="text-center text-sm sm:text-base mb-10 sm:mb-14 max-w-2xl mx-auto"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Everything competitors charge extra for are included in the $50 per
            month membership.
          </p>

          <ComparisonGrid />

          {/* Book Free Consult Button - Centered Below */}
          <div className="flex justify-center mt-12">
            <Button className="font-bold">BOOK FREE<br/> CONSULT NOW</Button>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="pt-32 pb-20 sm:pt-36 sm:pb-24 md:pt-40 md:pb-32" style={{ backgroundColor: "#E5E5E5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop View - Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* ISO Standards */}
            <div className="mx-auto w-full max-w-[300px] sm:max-w-none">
              <div className="text-center mb-4">
                <div className="text-2xl sm:text-3xl font-medium font-['Richmond']" style={{ color: "#353535" }}>
                  Backed By Expertise
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center aspect-square">
                <div className="w-32 h-32 sm:w-28 md:w-32 lg:w-36 mb-4 flex items-center justify-center">
                  <Image
                    src="/images/certifications/iso.png"
                    alt="ISO 22000"
                    width={144}
                    height={144}
                    className="object-contain w-full h-full"
                  />
                </div>
                <p className="text-sm sm:text-base" style={{ color: "#353535" }}>
                  ISO 22000 & EU<br />
                  Pharmacopoeia<br />
                  herbal standards
                </p>
              </div>
            </div>

            {/* GDPR */}
            <div className="mx-auto w-full max-w-[300px] sm:max-w-none">
              <div className="text-center mb-4">
                <div className="text-2xl sm:text-3xl font-medium font-['Richmond']" style={{ color: "#353535" }}>
                  Certified For Safety
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center aspect-square">
                <div className="w-32 h-32 sm:w-28 md:w-32 lg:w-36 mb-4 flex items-center justify-center">
                  <Image
                    src="/images/certifications/gdpr.png"
                    alt="GDPR"
                    width={144}
                    height={144}
                    className="object-contain w-full h-full"
                  />
                </div>
                <p className="text-sm sm:text-base" style={{ color: "#353535" }}>
                  GDPR-compliant<br />
                  data privacy
                </p>
              </div>
            </div>

            {/* European Pharmacopoeia */}
            <div className="mx-auto w-full max-w-[300px] sm:max-w-none sm:col-span-2 lg:col-span-1">
              <div className="text-center mb-4">
                <div className="text-2xl sm:text-3xl font-medium font-['Richmond']" style={{ color: "#353535" }}>
                  Trusted By Design
                </div>
              </div>
              <div className="bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center aspect-square sm:max-w-[300px] sm:mx-auto lg:max-w-none">
                <div className="w-20 h-20 sm:w-20 md:w-24 lg:w-28 mb-4 flex items-center justify-center">
                  <Image
                    src="/images/certifications/europharm.png"
                    alt="European Pharmacopoeia"
                    width={112}
                    height={112}
                    className="object-contain w-full h-full"
                  />
                </div>
                <p className="text-sm sm:text-base" style={{ color: "#353535" }}>
                  Every supplement<br />
                  screened for drug<br />
                  interactions
                </p>
              </div>
            </div>
          </div>

          {/* Mobile View - Carousel with Arrows */}
          <div className="sm:hidden">
            <div className="flex items-center gap-2">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const currentIndex = parseInt(document.querySelector('.cert-dot-active')?.dataset?.index || '0');
                  const newIndex = Math.max(0, currentIndex - 1);
                  const offset = -newIndex * 100; // 100% width for each card

                  // Update carousel
                  const carousel = document.getElementById('cert-carousel');
                  carousel.style.transform = `translateX(${offset}%)`;

                  // Update dot colors
                  const dots = document.querySelectorAll('.cert-dot');
                  dots.forEach((dot, i) => {
                    dot.classList.remove('cert-dot-active');
                    if (i === newIndex) {
                      dot.classList.add('cert-dot-active');
                      dot.dataset.index = newIndex;
                    }
                    dot.style.backgroundColor = i === newIndex ? '#FFD3AC' : '#D1D5DB';
                  });
                }}
                className="flex-shrink-0"
                aria-label="Previous certification"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Carousel Content */}
              <div className="flex-1 overflow-hidden">
                <div
                  id="cert-carousel"
                  className="flex transition-transform duration-300"
                  style={{ transform: 'translateX(0px)' }}
                >
                  {/* ISO Standards Card */}
                  <div className="flex-none w-full px-2">
                    <div className="max-w-[300px] mx-auto">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-medium font-['Richmond']" style={{ color: "#353535" }}>
                          Backed By Expertise
                        </div>
                      </div>
                      <div className="bg-white p-6 flex flex-col items-center justify-center text-center aspect-square">
                        <div className="w-32 h-32 mb-4 flex items-center justify-center">
                          <Image
                            src="/images/certifications/iso.png"
                            alt="ISO 22000"
                            width={144}
                            height={144}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <p className="text-sm" style={{ color: "#353535" }}>
                          ISO 22000 & EU<br />
                          Pharmacopoeia<br />
                          herbal standards
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* GDPR Card */}
                  <div className="flex-none w-full px-2">
                    <div className="max-w-[300px] mx-auto">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-medium font-['Richmond']" style={{ color: "#353535" }}>
                          Certified For Safety
                        </div>
                      </div>
                      <div className="bg-white p-6 flex flex-col items-center justify-center text-center aspect-square">
                        <div className="w-32 h-32 mb-4 flex items-center justify-center">
                          <Image
                            src="/images/certifications/gdpr.png"
                            alt="GDPR"
                            width={144}
                            height={144}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <p className="text-sm" style={{ color: "#353535" }}>
                          GDPR-compliant<br />
                          data privacy
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* European Pharmacopoeia Card */}
                  <div className="flex-none w-full px-2">
                    <div className="max-w-[300px] mx-auto">
                      <div className="text-center mb-4">
                        <div className="text-2xl font-medium font-['Richmond']" style={{ color: "#353535" }}>
                          Trusted By Design
                        </div>
                      </div>
                      <div className="bg-white p-6 flex flex-col items-center justify-center text-center aspect-square">
                        <div className="w-20 h-20 mb-4 flex items-center justify-center">
                          <Image
                            src="/images/certifications/europharm.png"
                            alt="European Pharmacopoeia"
                            width={112}
                            height={112}
                            className="object-contain w-full h-full"
                          />
                        </div>
                        <p className="text-sm" style={{ color: "#353535" }}>
                          Every supplement<br />
                          screened for drug<br />
                          interactions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const currentIndex = parseInt(document.querySelector('.cert-dot-active')?.dataset?.index || '0');
                  const newIndex = Math.min(2, currentIndex + 1); // Max 2 for 3 cards

                  const offset = -newIndex * 100; // 100% width for each card

                  // Update carousel
                  const carousel = document.getElementById('cert-carousel');
                  carousel.style.transform = `translateX(${offset}%)`;

                  // Update dot colors
                  const dots = document.querySelectorAll('.cert-dot');
                  dots.forEach((dot, i) => {
                    dot.classList.remove('cert-dot-active');
                    if (i === newIndex) {
                      dot.classList.add('cert-dot-active');
                      dot.dataset.index = newIndex;
                    }
                    dot.style.backgroundColor = i === newIndex ? '#FFD3AC' : '#D1D5DB';
                  });
                }}
                className="flex-shrink-0"
                aria-label="Next certification"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors cert-dot ${index === 0 ? 'cert-dot-active' : ''}`}
                  style={{ backgroundColor: index === 0 ? '#FFD3AC' : '#D1D5DB' }}
                  data-index={index}
                  onClick={() => {
                    const offset = -index * 100; // 100% width for each card

                    // Update carousel
                    const carousel = document.getElementById('cert-carousel');
                    carousel.style.transform = `translateX(${offset}%)`;

                    // Update dot colors
                    const dots = document.querySelectorAll('.cert-dot');
                    dots.forEach((dot, i) => {
                      dot.classList.remove('cert-dot-active');
                      if (i === index) {
                        dot.classList.add('cert-dot-active');
                        dot.dataset.index = index;
                      }
                      dot.style.backgroundColor = i === index ? '#FFD3AC' : '#D1D5DB';
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Ambé Difference Section */}
      {/* <section className="py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className={sectionTitleClasses + " mb-16"}>
            The Ambé Difference
          </div>

          {/* Three Feature Cards */}
      {/* <div className="grid md:grid-cols-3 gap-8 mb-32">
            {/* Precision You Can Trust */}
      {/* <div className="p-6 flex items-center gap-4" style={{ backgroundColor: '#FFD3AC', borderRadius: '0 100px 0 100px', height: '140px' }}>
              <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V12C2 17.5 5.25 22.5 12 24C18.75 22.5 22 17.5 22 12V7L12 2Z" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold mb-1" style={{ color: '#353535' }}>
                  Precision You Can<br />Trust
                </div>
                <p className="text-sm" style={{ color: '#353535' }}>
                  Doctors cross- trained in time tested and modern science
                </p>
              </div>
            </div> */}

      {/* Care You Can Feel */}
      {/* <div className="p-6 flex items-center gap-4" style={{ backgroundColor: '#FFD3AC', borderRadius: '0 100px 0 100px', height: '140px' }}>
              <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10V7C7 6.46957 7.21071 5.96086 7.58579 5.58579C7.96086 5.21071 8.46957 5 9 5H15C15.5304 5 16.0391 5.21071 16.4142 5.58579C16.7893 5.96086 17 6.46957 17 7V10" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 11C5 10.4696 5.21071 9.96086 5.58579 9.58579C5.96086 9.21071 6.46957 9 7 9H17C17.5304 9 18.0391 9.21071 18.4142 9.58579C18.7893 9.96086 19 10.4696 19 11V13C19 17.4183 15.4183 21 11 21H9" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5V9" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold mb-1" style={{ color: '#353535' }}>
                  Care You Can<br />Feel
                </div>
                <p className="text-sm" style={{ color: '#353535' }}>
                  Plans crafted around your whole self & labs
                </p>
              </div>
            </div> */}

      {/* Ethics You Can Stand Behind */}
      {/* <div className="p-6 flex items-center gap-4" style={{ backgroundColor: '#FFD3AC', borderRadius: '0 100px 0 100px', height: '140px' }}>
              <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="2" width="8" height="4" rx="1" stroke="#353535" strokeWidth="2"/>
                  <path d="M16 6V10C16 10.7956 15.6839 11.5587 15.1213 12.1213C14.5587 12.6839 13.7956 13 13 13H11C10.2044 13 9.44129 12.6839 8.87868 12.1213C8.31607 11.5587 8 10.7956 8 10V6" stroke="#353535" strokeWidth="2"/>
                  <path d="M4 7H20" stroke="#353535" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 7V19C8 20.1046 8.89543 21 10 21H14C15.1046 21 16 20.1046 16 19V7" stroke="#353535" strokeWidth="2"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-lg font-semibold mb-1" style={{ color: '#353535' }}>
                  Ethics You Can Stand<br />Behind
                </div>
                <p className="text-sm" style={{ color: '#353535' }}>
                  Fair-trade sourcing, real transparency
                </p>
              </div>
            </div>
          </div> */}

      {/* Circular Diagram Section */}
      {/* <div className="relative">
            <div className="flex items-center">
              {/* White circle with text content - all the way to the left */}
      {/* <div className="bg-white rounded-full p-14 flex flex-col justify-center text-center shadow-lg w-[500px] h-[500px] flex-shrink-0">
                <div className="text-2xl font-semibold mb-6" style={{ color: '#353535' }}>
                  1. Clinical Precision
                </div>
                
                <div className="mb-6">
                  <div className="font-semibold mb-2" style={{ color: '#353535' }}>What We Do</div>
                  <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                    Doctors trained in traditional and ayurvedic medicine and modern integrative science. Recognize interactions between herbal and pharmaceutical protocols.
                  </p>
                </div>

                <div>
                  <div className="font-semibold mb-2" style={{ color: '#353535' }}>Why It Matters</div>
                  <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                    Prevents serious side effects from poor combinations (e.g., SSRIs + Brahmi, beta-blockers + Ashwagandha, blood thinners + turmeric).
                  </p>
                </div>
              </div> */}

      {/* Arc segments image - bigger and close to the right of circle */}
      {/* <Image 
                src="/images/home/arc_segments.png" 
                alt="Arc Segments" 
                width={800}
                height={800}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section> */}

      {/* Steps Section - no title */}
      <section
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: "#E5E5E5" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop View - Grid */}
          <div className="hidden sm:grid grid-cols-1 xl:grid-cols-2 gap-x-8 lg:gap-x-16 xl:gap-x-32 gap-y-8 sm:gap-y-12 md:gap-y-16">
            {/* Left Column - Steps 1 & 2 */}
            <div className="space-y-8 sm:space-y-12 md:space-y-16">
              {/* Step 1 - Book */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 text-center sm:text-left">
                <Image
                  src="/images/home/step1.png"
                  alt="Step 1"
                  width={160}
                  height={128}
                  className="w-32 sm:w-36 md:w-40 h-24 sm:h-28 md:h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <div
                    className="text-xl sm:text-2xl font-semibold mb-2"
                    style={{ color: "#353535" }}
                  >
                    Book
                  </div>
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "#535353" }}
                  >
                    Book now, and fill out your secured details to be matched
                    with a doctor specific to your unique needs.
                  </p>
                </div>
              </div>

              {/* Step 2 - Video Call */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 text-center sm:text-left">
                <Image
                  src="/images/home/step2.png"
                  alt="Step 2"
                  width={160}
                  height={128}
                  className="w-32 sm:w-36 md:w-40 h-24 sm:h-28 md:h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <div
                    className="text-xl sm:text-2xl font-semibold mb-2"
                    style={{ color: "#353535" }}
                  >
                    Video Call
                  </div>
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "#535353" }}
                  >
                    Video chat with your specialist.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Steps 3 & 4 */}
            <div className="space-y-8 sm:space-y-12 md:space-y-16">
              {/* Step 3 - Get Care + Unlimited Text */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 text-center sm:text-left">
                <Image
                  src="/images/home/step3.png"
                  alt="Step 3"
                  width={160}
                  height={128}
                  className="w-32 sm:w-36 md:w-40 h-24 sm:h-28 md:h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <div
                    className="text-xl sm:text-2xl font-semibold mb-2"
                    style={{ color: "#353535" }}
                  >
                    Get Care + Unlimited Text
                  </div>
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "#535353" }}
                  >
                    Get customized diet, cleanse, lifestyle, exercise, yoga, and
                    meditation plans by your specialist — plus unlimited
                    texting.
                  </p>
                </div>
              </div>

              {/* Step 4 - Monthly Video Follow Up */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8 text-center sm:text-left">
                <Image
                  src="/images/home/step4.png"
                  alt="Step 4"
                  width={160}
                  height={128}
                  className="w-32 sm:w-36 md:w-40 h-24 sm:h-28 md:h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <div
                    className="text-xl sm:text-2xl font-semibold mb-2"
                    style={{ color: "#353535" }}
                  >
                    Monthly Video Follow Up
                  </div>
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: "#535353" }}
                  >
                    Monthly video call — essential care takes persistence.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile View - Carousel with Arrows */}
          <div className="sm:hidden">
            <div className="flex items-center gap-1">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const currentIndex = parseInt(document.querySelector('.steps-dot-active')?.dataset?.index || '0');
                  const newIndex = Math.max(0, currentIndex - 1);
                  const offset = -newIndex * 100; // 100% width for each page

                  // Update carousel
                  const carousel = document.getElementById('steps-carousel');
                  carousel.style.transform = `translateX(${offset}%)`;

                  // Update dot colors
                  const dots = document.querySelectorAll('.steps-dot');
                  dots.forEach((dot, i) => {
                    dot.classList.remove('steps-dot-active');
                    if (i === newIndex) {
                      dot.classList.add('steps-dot-active');
                      dot.dataset.index = newIndex;
                    }
                    dot.style.backgroundColor = i === newIndex ? '#FFD3AC' : '#D1D5DB';
                  });
                }}
                className="flex-shrink-0 -ml-1"
                aria-label="Previous steps"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Carousel Content */}
              <div className="flex-1 overflow-hidden">
                <div
                  id="steps-carousel"
                  className="flex transition-transform duration-300"
                  style={{ transform: 'translateX(0px)' }}
                >
                  {/* First Page - Steps 1 & 2 */}
                  <div className="flex-none w-full px-2">
                    <div className="space-y-8">
                      {/* Step 1 - Book */}
                      <div className="flex items-center gap-4">
                        <Image
                          src="/images/home/step1.png"
                          alt="Step 1"
                          width={96}
                          height={72}
                          className="w-24 h-20 object-contain flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-lg font-semibold mb-1" style={{ color: "#353535" }}>
                            Book
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "#535353" }}>
                            Book now, and fill out your secured details to be matched
                            with a doctor specific to your unique needs.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 - Video Call */}
                      <div className="flex items-center gap-4">
                        <Image
                          src="/images/home/step2.png"
                          alt="Step 2"
                          width={96}
                          height={72}
                          className="w-24 h-20 object-contain flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-lg font-semibold mb-1" style={{ color: "#353535" }}>
                            Video Call
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "#535353" }}>
                            Video chat with your specialist.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second Page - Steps 3 & 4 */}
                  <div className="flex-none w-full px-2">
                    <div className="space-y-8">
                      {/* Step 3 - Get Care + Unlimited Text */}
                      <div className="flex items-center gap-4">
                        <Image
                          src="/images/home/step3.png"
                          alt="Step 3"
                          width={96}
                          height={72}
                          className="w-24 h-20 object-contain flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-lg font-semibold mb-1" style={{ color: "#353535" }}>
                            Get Care + Unlimited Text
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "#535353" }}>
                            Get customized diet, cleanse, lifestyle, exercise, yoga, and
                            meditation plans by your specialist — plus unlimited texting.
                          </p>
                        </div>
                      </div>

                      {/* Step 4 - Monthly Video Follow Up */}
                      <div className="flex items-center gap-4">
                        <Image
                          src="/images/home/step4.png"
                          alt="Step 4"
                          width={96}
                          height={72}
                          className="w-24 h-20 object-contain flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-lg font-semibold mb-1" style={{ color: "#353535" }}>
                            Monthly Video Follow Up
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: "#535353" }}>
                            Monthly video call — essential care takes persistence.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const currentIndex = parseInt(document.querySelector('.steps-dot-active')?.dataset?.index || '0');
                  const newIndex = Math.min(1, currentIndex + 1); // Max 1 for 2 pages

                  const offset = -newIndex * 100; // 100% width for each page

                  // Update carousel
                  const carousel = document.getElementById('steps-carousel');
                  carousel.style.transform = `translateX(${offset}%)`;

                  // Update dot colors
                  const dots = document.querySelectorAll('.steps-dot');
                  dots.forEach((dot, i) => {
                    dot.classList.remove('steps-dot-active');
                    if (i === newIndex) {
                      dot.classList.add('steps-dot-active');
                      dot.dataset.index = newIndex;
                    }
                    dot.style.backgroundColor = i === newIndex ? '#FFD3AC' : '#D1D5DB';
                  });
                }}
                className="flex-shrink-0 -mr-1"
                aria-label="Next steps"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors steps-dot ${index === 0 ? 'steps-dot-active' : ''}`}
                  style={{ backgroundColor: index === 0 ? '#FFD3AC' : '#D1D5DB' }}
                  data-index={index}
                  onClick={() => {
                    const offset = -index * 100; // 100% width for each page

                    // Update carousel
                    const carousel = document.getElementById('steps-carousel');
                    carousel.style.transform = `translateX(${offset}%)`;

                    // Update dot colors
                    const dots = document.querySelectorAll('.steps-dot');
                    dots.forEach((dot, i) => {
                      dot.classList.remove('steps-dot-active');
                      if (i === index) {
                        dot.classList.add('steps-dot-active');
                        dot.dataset.index = index;
                      }
                      dot.style.backgroundColor = i === index ? '#FFD3AC' : '#D1D5DB';
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Callout Band - charcoal band after the steps grid */}
      <PricingCallout />

      {/* Meet the Experts Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: "#E5E5E5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              sectionTitleClasses +
              " text-center mb-4 text-2xl sm:text-3xl md:text-4xl"
            }
          >
            Meet the Experts
          </div>
          <p className="text-center text-base sm:text-lg mb-8 sm:mb-12 md:mb-16 max-w-7xl mx-auto text-body px-4">
            Licensed. Global. Guided by science. Every Ambé practitioner is
            trained in traditional medicine and modern clinical
            frameworks–bringing deep expertise to every personalized plan.
          </p>

          {/* Desktop Doctors Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctorList.map((d) => (
              <div
                key={d.name}
                onClick={() => setSelectedDoctor(d)}
                className="bg-white p-6 sm:p-8 text-center cursor-pointer hover:shadow-lg transition"
              >
                <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full mx-auto mb-4 overflow-hidden">
                  <Image src={d.image} alt={d.name} fill className="object-cover" />
                </div>
                <div className="text-lg sm:text-xl font-semibold mb-1 text-charcoal">
                  {d.name}
                </div>
                <p className="text-sm mb-1 text-body">MBBS</p>
                <p className="text-sm mb-2 text-body">BAMS</p>
                <p className="text-sm mb-1 text-body">Doctor of Ayurvedic</p>
                <p className="text-sm mb-1 text-body">Medicine and Surgery</p>
                <p className="text-sm font-medium text-charcoal">{d.specialty}</p>
                {d.isMedicalDirector && (
                  <div className="mt-3">
                    <MedicalDirectorBadge />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile Doctors Carousel */}
          <div className="sm:hidden">
            <div className="flex items-center gap-1">
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const currentIndex = parseInt(document.querySelector('.experts-dot-active')?.dataset?.index || '0');
                  const newIndex = Math.max(0, currentIndex - 1);
                  const offset = -newIndex * 100; // 100% width for each expert

                  // Update carousel
                  const carousel = document.getElementById('experts-carousel');
                  carousel.style.transform = `translateX(${offset}%)`;

                  // Update dot colors
                  const dots = document.querySelectorAll('.experts-dot');
                  dots.forEach((dot, i) => {
                    dot.classList.remove('experts-dot-active');
                    if (i === newIndex) {
                      dot.classList.add('experts-dot-active');
                      dot.dataset.index = newIndex;
                    }
                    dot.style.backgroundColor = i === newIndex ? '#FFD3AC' : '#D1D5DB';
                  });
                }}
                className="flex-shrink-0 -ml-1"
                aria-label="Previous expert"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Carousel Content */}
              <div className="flex-1 overflow-hidden">
                <div
                  id="experts-carousel"
                  className="flex transition-transform duration-300"
                  style={{ transform: 'translateX(0px)' }}
                >
                  {doctorList.map((d) => (
                    <div key={d.name} className="flex-none w-full px-2">
                      <div
                        onClick={() => setSelectedDoctor(d)}
                        className="bg-white p-6 text-center cursor-pointer hover:shadow-lg transition"
                      >
                        <div className="relative w-32 h-32 rounded-full mx-auto mb-4 overflow-hidden">
                          <Image src={d.image} alt={d.name} fill className="object-cover" />
                        </div>
                        <div className="text-lg font-semibold mb-1 text-charcoal">
                          {d.name}
                        </div>
                        <p className="text-sm mb-1 text-body">MBBS</p>
                        <p className="text-sm mb-2 text-body">BAMS</p>
                        <p className="text-sm mb-1 text-body">Doctor of Ayurvedic</p>
                        <p className="text-sm mb-1 text-body">Medicine and Surgery</p>
                        <p className="text-sm font-medium text-charcoal">{d.specialty}</p>
                        {d.isMedicalDirector && (
                          <div className="mt-3">
                            <MedicalDirectorBadge />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const currentIndex = parseInt(document.querySelector('.experts-dot-active')?.dataset?.index || '0');
                  const newIndex = Math.min(3, currentIndex + 1); // Max 3 for 4 experts

                  const offset = -newIndex * 100; // 100% width for each expert

                  // Update carousel
                  const carousel = document.getElementById('experts-carousel');
                  carousel.style.transform = `translateX(${offset}%)`;

                  // Update dot colors
                  const dots = document.querySelectorAll('.experts-dot');
                  dots.forEach((dot, i) => {
                    dot.classList.remove('experts-dot-active');
                    if (i === newIndex) {
                      dot.classList.add('experts-dot-active');
                      dot.dataset.index = newIndex;
                    }
                    dot.style.backgroundColor = i === newIndex ? '#FFD3AC' : '#D1D5DB';
                  });
                }}
                className="flex-shrink-0 -mr-1"
                aria-label="Next expert"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#353535" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors experts-dot ${index === 0 ? 'experts-dot-active' : ''}`}
                  style={{ backgroundColor: index === 0 ? '#FFD3AC' : '#D1D5DB' }}
                  data-index={index}
                  onClick={() => {
                    const offset = -index * 100; // 100% width for each expert

                    // Update carousel
                    const carousel = document.getElementById('experts-carousel');
                    carousel.style.transform = `translateX(${offset}%)`;

                    // Update dot colors
                    const dots = document.querySelectorAll('.experts-dot');
                    dots.forEach((dot, i) => {
                      dot.classList.remove('experts-dot-active');
                      if (i === index) {
                        dot.classList.add('experts-dot-active');
                        dot.dataset.index = index;
                      }
                      dot.style.backgroundColor = i === index ? '#FFD3AC' : '#D1D5DB';
                    });
                  }}
                />
              ))}
            </div>
          </div>

          {/* Doctor Profile Fine Print — identical for every practitioner */}
          <DoctorProfileFinePrint className="mt-10 sm:mt-12 max-w-4xl mx-auto" />

          {/* Book Free Consult Button - Centered Below */}
          <div className="flex justify-center mt-12">
            <Button className="font-bold">BOOK FREE<br/> CONSULT NOW</Button>
          </div>
        </div>
      </section>

      {/* Wellness Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: "#E5E5E5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="relative w-full" style={{ overflow: "hidden" }}>
              {/* Scrollable Container - fixed width to show exactly 3 items */}
              <div 
                id="wellness-scroll"
                className="flex gap-8 overflow-x-auto snap-x snap-mandatory scrollbar-hide" 
                style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none" }}
                onScroll={(e) => {
                  const scrollPosition = e.target.scrollLeft;
                  const containerWidth = e.target.scrollWidth / 3; // Total width divided by 3 groups
                  
                  // Update desktop dots (groups of 3)
                  const currentPage = Math.round(scrollPosition / containerWidth);
                  const dots = document.querySelectorAll('.wellness-dot');
                  dots.forEach((dot, index) => {
                    if (index === currentPage) {
                      dot.style.backgroundColor = '#FFD3AC';
                      dot.style.borderColor = '#FFD3AC';
                    } else {
                      dot.style.backgroundColor = 'transparent';
                      dot.style.borderColor = '#353535';
                    }
                  });
                  
                  // Update mobile dots (individual items)
                  const itemWidth = 380 + 32; // 380px circle width + 32px gap
                  const currentItem = Math.round(scrollPosition / itemWidth);
                  const mobileDots = document.querySelectorAll('.wellness-dot-mobile');
                  mobileDots.forEach((dot, index) => {
                    if (index === currentItem) {
                      dot.style.backgroundColor = '#353535';
                    } else {
                      dot.style.backgroundColor = '#D0D0D0';
                    }
                  });
                  
                  // Show/hide arrows based on scroll position
                  const rightArrow = document.getElementById('wellness-arrow');
                  const leftArrow = document.getElementById('wellness-arrow-left');
                  if (rightArrow) {
                    const maxScroll = e.target.scrollWidth - e.target.clientWidth;
                    if (scrollPosition >= maxScroll - 10) {
                      rightArrow.style.opacity = '0';
                      rightArrow.style.pointerEvents = 'none';
                    } else {
                      rightArrow.style.opacity = '1';
                      rightArrow.style.pointerEvents = 'auto';
                    }
                  }
                  if (leftArrow) {
                    if (scrollPosition > 10) {
                      leftArrow.style.opacity = '1';
                      leftArrow.style.pointerEvents = 'auto';
                    } else {
                      leftArrow.style.opacity = '0';
                      leftArrow.style.pointerEvents = 'none';
                    }
                  }
                }}
              >
              {/* Hormone Health */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/hormone_health.png"
                      alt="Hormone Health"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Hormone Health
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Balance, not band-aids with adverse long term affects nor dependency. From cycle irregularities to adrenal burnout to testosterone fluctuations, we decode your hormonal profile using advanced labs and Ayurvedic principles—then tailor a plan that actually works for you.
                  </p>
                </div>
              </div>

              {/* Women's Health */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/womens_health.png"
                      alt="Women's Health"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Women&apos;s Health
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Whole-woman care, redefined. From menstruation to menopause, fertility to fibroids—we offer precise, culturally competent, deeply supportive care that treats the whole woman, not just her symptoms.                  </p>
                </div>
              </div>

              {/* Men's Health */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/mens_health.png"
                      alt="Men's Health"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Men&apos;s Health
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
More than testosterone. We address the full spectrum—from vitality and libido to stress, sleep, and prostate support—blending traditional and allopathic medicine science to build long-term performance and resilience.                  </p>
                </div>
              </div>

              {/* Musculoskeletal */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/musculoskeletal.png"
                      alt="Musculoskeletal"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Musculoskeletal
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Move freely. Live fully. Whether it’s pain, posture, inflammation, or injury recovery—we integrate Ayurveda, biomechanics, and physical optimization protocols personalized to your structure.                  </p>
                </div>
              </div>

              {/* Emotional, Mental & Behavioral */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/emotional_behavorial.png"
                      alt="Emotional, Mental & Behavioral"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Emotional, Mental & Behavioral
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Your mind-body reboot. Anxiety, burnout, depression, addiction patterns—no surface fixes. We offer deep emotional recalibration through neuro-supportive herbs, behavior rewiring, and somatic therapies that stick.                  </p>
                </div>
              </div>

              {/* Oncology Support */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/oncology.png"
                      alt="Oncology Support"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Oncology Support
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Rooted care during hard seasons. For those undergoing or recovering from cancer, we provide complementary pathways that nourish, restore, and support immunity—with compassion and precision.                  </p>
                </div>
              </div>

              {/* Tailor Made Medicine Program */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/tailor-made.png"
                      alt="Tailor Made Medicine Program"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Tailor Made Medicine Programs
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Built for you. Not the algorithm. We don’t do fads. We do personalized, long-game protocols aligned with your body type, labs, lifestyle, and history. This is medicine made human again.                  </p>
                </div>
              </div>

              {/* Whole Body & Mind Health Scans */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/whole_body.png"
                      alt="Whole Body & Mind Health Scans"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Whole Body & Mind Health Scans
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
Your environment heals with you. We give you step-by-step plans for detoxing your space, body care routines, and healing rhythms to keep your inner and outer worlds in sync.                  </p>
                </div>
              </div>

              {/* Whole Kitchen & Your Kitchen */}
              <div className="flex-none snap-start" style={{ width: "380px" }}>
                <div className="rounded-full p-10 pt-8 flex flex-col items-center text-center justify-start" style={{ backgroundColor: "#FFD3AC", width: "380px", height: "380px" }}>
                  <div className="w-16 h-16 mb-4">
                    <Image
                      src="/images/icons/whole_kitchen.png"
                      alt="Whole Kitchen & Your Kitchen"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div className="text-lg font-semibold mb-2" style={{ color: "#353535" }}>
                    Whole Kitchen & Your Kitchen
                  </div>
                  <p className="text-base" style={{ color: "#353535" }}>
What you eat—and feed your pets—matters. Simple, practical guidance to transform your kitchen into a healing center, with Ayurvedic and vet-approved tips for feeding those you love.                  </p>
                </div>
              </div>
            </div>
            </div>
          </div>
          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
              {/* Desktop dots - 3 for groups of 3 */}
              <div className="hidden sm:flex gap-3">
                <div 
                  className="wellness-dot w-3 h-3 rounded-full cursor-pointer transition-all border"
                  style={{ backgroundColor: "#FFD3AC", borderColor: "#FFD3AC" }}
                  onClick={() => {
                    document.getElementById('wellness-scroll').scrollTo({ left: 0, behavior: 'smooth' });
                  }}
                />
                <div 
                  className="wellness-dot w-3 h-3 rounded-full cursor-pointer transition-all border"
                  style={{ backgroundColor: "transparent", borderColor: "#353535" }}
                  onClick={() => {
                    const itemWidth = 380 + 32; // circle width + gap
                    document.getElementById('wellness-scroll').scrollTo({ left: itemWidth * 3, behavior: 'smooth' });
                  }}
                />
                <div 
                  className="wellness-dot w-3 h-3 rounded-full cursor-pointer transition-all border"
                  style={{ backgroundColor: "transparent", borderColor: "#353535" }}
                  onClick={() => {
                    const itemWidth = 380 + 32; // circle width + gap
                    document.getElementById('wellness-scroll').scrollTo({ left: itemWidth * 6, behavior: 'smooth' });
                  }}
                />
              </div>
              {/* Mobile dots - 9 for individual items */}
              <div className="flex sm:hidden gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                  <div 
                    key={index}
                    className="wellness-dot-mobile w-2 h-2 rounded-full cursor-pointer transition-colors"
                    style={{ backgroundColor: index === 0 ? "#353535" : "#D0D0D0" }}
                    onClick={() => {
                      document.getElementById('wellness-scroll').scrollTo({ left: index * 344, behavior: 'smooth' });
                    }}
                  />
                ))}
              </div>
            </div>
        </div>
      </section>

      {/* Nutritionist Comparison Table */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <NutritionistTable />
        </div>
      </section>

      {/* Biomarkers Q&A Accordion */}
      <section
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: "#E5E5E5" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BiomarkersAccordion
            image={tabContent['biomarkers'].image}
            imageAlt="Holistic care"
            items={[
              { title: "Do You Need Labs for HRT?", body: tabContent['labs'].text },
              { title: "Biomarkers and Holistic Integration", body: tabContent['biomarkers'].text },
              { title: "How We Personalize Every Formula", body: tabContent['personalize'].text },
              { title: "Prevent Contraindicated Therapies with Pharmaceuticals", body: tabContent['prevent'].text },
              { title: "Mislabeled Therapies to Watch Out For", body: tabContent['mislabeled'].text },
            ]}
          />
        </div>
      </section>


      {/* App Download Section */}
      <AppDownload />

      {/* Quote Section and Footer - Combined with single video background */}
      <section className="relative">
        <VideoBackground />
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]"></div>
        <div className="relative z-10">
          {/* Quote Section */}
          <div className="py-12 sm:py-16 md:py-24">
            {/* Quote Container */}
            <div className="max-w-5xl mx-auto px-6 sm:px-8">
              <div className="relative">
                {/* Quote Icon - positioned at the top border */}
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 -top-10 sm:-top-12 w-20 sm:w-24 h-20 sm:h-24 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: "#E5E5E5" }}
                >
                  <span
                    className="text-8xl sm:text-9xl"
                    style={{ color: "#FFD3AC", fontSize: "120px", lineHeight: "0.3", marginTop: "30px" }}
                  >
                    &ldquo;
                  </span>
                </div>

                {/* Container */}
                <div
                  className="rounded-2xl sm:rounded-3xl pt-16 sm:pt-20 pb-12 sm:pb-16 px-6 sm:px-8 md:px-12"
                  style={{ backgroundColor: "rgba(244, 244, 244, 0.7)" }}
                >
                  <div className="max-w-4xl mx-auto text-center">
                    {/* First paragraph */}
                    <p
                      className="text-sm sm:text-base md:text-lg lg:text-xl mb-3 sm:mb-4"
                      style={{ color: "#353535" }}
                    >
                      We&apos;re doctors, entrepreneurs and researchers with
                      decades of experience. Ambé is built for the soul of the modern man.
                    </p>

                    {/* Main Quote */}
                    <div
                      className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-light leading-snug mb-2 sm:mb-4"
                      style={{
                        color: "#353535",
                        fontFamily: "Playfair Display, serif",
                      }}
                    >
                      With loving support, we can blossom into
                      <br className="hidden sm:block" />
                      <span className="sm:hidden">
                        With loving support, we can blossom into{" "}
                      </span>
                      our full potential.
                    </div>

                    {/* Attribution */}
                    <p
                      className="text-right text-sm sm:text-base md:text-lg mt-2 mb-4"
                      style={{ color: "#353535" }}
                    >
                      -Founder
                    </p>
                    
                    {/* Ten trees text */}
                    <p
                      className="text-sm sm:text-base leading-relaxed text-center"
                      style={{ color: "#353535" }}
                    >
                      Ten trees planted per member, per month = 120 trees per year
                      per member. Our health depends on the health of Mother Nature — trees are proven to be the #1
                      way to purify and nourish the environment and help avert.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Book Free Consult Button */}
            <div className="flex justify-center mt-12">
              <Button className="font-bold">BOOK FREE<br/> CONSULT NOW</Button>
            </div>

          </div>

          {/* Footer */}
          <Footer />
        </div>
      </section>
    </div>
  );
}
