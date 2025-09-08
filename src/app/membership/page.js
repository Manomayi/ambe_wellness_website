"use client";
import React from 'react';
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

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden py-20">
        {/* Video Background */}
        <VideoBackground />
        
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]"></div>
        
        <div className="relative z-10 w-full flex justify-center">
          <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-16">
            <div className="max-w-3xl">
              <div className={bannerTitleClasses + " mb-4 leading-tight"} style={{ color: 'white' }}>
                Your Wellness. Fully Covered.
              </div>
              <p className="text-white mb-8 text-base sm:text-lg md:text-xl font-light" style={{ color: 'white' }}>
                Unlimited care. One monthly price.
              </p>
              
              <Button>
                JOIN NOW
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          {/* Title */}
          <div className={sectionTitleClasses + " text-center mb-8 sm:mb-12 md:mb-16 text-2xl sm:text-3xl md:text-4xl"}>
            What You Get
          </div>

          {/* Icons Row */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 mb-8 sm:mb-12 md:mb-16">
            {/* Personalized Wellness Plan */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full bg-white flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
              <span className="text-3xl sm:text-4xl mb-2" style={{ color: '#FFD3AC' }}>📋</span>
              <p className="text-sm sm:text-base text-center" style={{ color: '#353535' }}>
                Personalized<br />
                Wellness Plan <span className="text-xs sm:text-sm">✓</span>
              </p>
            </div>

            {/* Unlimited Texting */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full bg-white flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
              <span className="text-3xl sm:text-4xl mb-2" style={{ color: '#FFD3AC' }}>💬</span>
              <p className="text-sm sm:text-base text-center" style={{ color: '#353535' }}>
                Unlimited<br />
                Texting <span className="text-xs sm:text-sm">✓</span>
              </p>
            </div>

            {/* 1 Hour Video Call Monthly - Center/Highlighted */}
            <div className="w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 lg:w-56 lg:h-56 rounded-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 order-first md:order-none" style={{ backgroundColor: '#FFD3AC' }}>
              <span className="text-4xl sm:text-5xl mb-2 sm:mb-3" style={{ color: '#353535' }}>📱</span>
              <p className="text-base sm:text-lg md:text-xl font-medium mb-1 sm:mb-2 text-center" style={{ color: '#353535' }}>
                1 Hour Video Call<br />
                Monthly
              </p>
              <p className="text-sm sm:text-base text-center" style={{ color: '#353535' }}>
                Get the attention you<br />
                deserve
              </p>
            </div>

            {/* Remedies Included */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full bg-white flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
              <span className="text-3xl sm:text-4xl mb-2" style={{ color: '#FFD3AC' }}>💊</span>
              <p className="text-sm sm:text-base text-center" style={{ color: '#353535' }}>
                Remedies<br />
                Included
              </p>
            </div>

            {/* Bath, Body, Food & Tea Perks */}
            <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full bg-white flex flex-col items-center justify-center p-4 sm:p-5 md:p-6">
              <span className="text-3xl sm:text-4xl mb-2" style={{ color: '#FFD3AC' }}>🍵</span>
              <p className="text-sm sm:text-base text-center" style={{ color: '#353535' }}>
                Bath, Body,Food<br />
                & Tea Perks
              </p>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-lg sm:text-xl md:text-2xl font-light text-center px-4 sm:px-0" style={{ color: '#353535' }}>
            Always 20%+ Discount on vitamins and minerals.
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
            {/* Left Column - Pricing */}
            <div className="w-full lg:flex-1">
              <div className={sectionTitleClasses + " mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Pricing
              </div>
              
              {/* Ambe Membership Card */}
              <div 
                className="p-6 sm:p-8 rounded-2xl mb-8 max-w-md mx-auto lg:max-w-none"
                style={{ backgroundColor: 'white' }}
              >
                {/* Peach Header */}
                <div 
                  className="p-4 sm:p-6 -m-6 sm:-m-8 mb-4 sm:mb-6 rounded-t-2xl text-center"
                  style={{ backgroundColor: '#FFD3AC' }}
                >
                  <div className="text-xl sm:text-2xl font-medium mb-2" style={{ color: '#353535' }}>
                    Ambe Membership
                  </div>
                  <div className="text-2xl sm:text-3xl font-semibold" style={{ color: '#353535' }}>
                    $150 sign-up and $50<span className="text-base sm:text-lg">/month</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#FFD3AC' }}>✓</span>
                    <span style={{ color: '#535353' }}>One-hour video call monthly</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#FFD3AC' }}>✓</span>
                    <span style={{ color: '#535353' }}>Unlimited text</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#FFD3AC' }}>✓</span>
                    <span style={{ color: '#535353' }}>Personalized protocols</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#FFD3AC' }}>✓</span>
                    <span style={{ color: '#535353' }}>All recommended remedies included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#FFD3AC' }}>✓</span>
                    <span style={{ color: '#535353' }}>Bath, body, food, and tea products</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: '#FFD3AC' }}>✓</span>
                    <span style={{ color: '#535353' }}>20%+ discount on additional products</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Pay As You Like */}
            <div className="w-full lg:flex-1">
              <div className={sectionTitleClasses + " mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Pay-As-You-Like Plan
              </div>

              {/* Three Cards */}
              <div className="space-y-4 sm:space-y-6 max-w-md mx-auto lg:max-w-none">
                {/* Free first consult */}
                <div 
                  className="p-4 sm:p-6 rounded-2xl flex items-center gap-4 sm:gap-6"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="20" y="15" width="40" height="30" rx="2" stroke="#FFD3AC" strokeWidth="2"/>
                      <circle cx="30" cy="30" r="5" stroke="#FFD3AC" strokeWidth="2"/>
                      <circle cx="50" cy="30" r="5" stroke="#FFD3AC" strokeWidth="2"/>
                      <path d="M25 55 Q40 65 55 55" stroke="#FFD3AC" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className="text-lg sm:text-xl" style={{ color: '#353535' }}>
                    Free first consult
                  </div>
                </div>

                {/* No text support */}
                <div 
                  className="p-4 sm:p-6 rounded-2xl flex items-center gap-4 sm:gap-6"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="20" y="25" width="40" height="30" rx="4" stroke="#FFD3AC" strokeWidth="2"/>
                      <path d="M30 35 H50 M30 40 H45 M30 45 H50" stroke="#FFD3AC" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="text-lg sm:text-xl" style={{ color: '#353535' }}>
                    No text support
                  </div>
                </div>

                {/* Products purchased separately */}
                <div 
                  className="p-4 sm:p-6 rounded-2xl flex items-center gap-4 sm:gap-6"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="35" cy="35" r="8" stroke="#FFD3AC" strokeWidth="2"/>
                      <text x="35" y="40" fill="#FFD3AC" textAnchor="middle" fontSize="16">$</text>
                      <circle cx="45" cy="45" r="8" stroke="#FFD3AC" strokeWidth="2"/>
                      <text x="45" y="50" fill="#FFD3AC" textAnchor="middle" fontSize="16">$</text>
                    </svg>
                  </div>
                  <div className="text-lg sm:text-xl" style={{ color: '#353535' }}>
                    Products purchased separately
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
          <div className={sectionTitleClasses + " text-center mb-8 sm:mb-10 md:mb-12 text-2xl sm:text-3xl md:text-4xl"}>
            Comparison Grid
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            {/* Column Headers */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div></div>
              <div className="text-center font-medium" style={{ color: '#353535' }}>
                Ambe Membership
              </div>
              <div className="text-center font-medium" style={{ color: '#353535' }}>
                Pay-As-You-Like
              </div>
              <div className="text-center font-medium" style={{ color: '#353535' }}>
                TYPICAL WELLNESS PROGRAMS
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-4">
            {/* Video Consults */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="font-medium" style={{ color: '#353535' }}>
                Video Consults
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                <span className="text-sm" style={{ color: '#353535' }}>1 hr/month included</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span className="text-sm" style={{ color: '#535353' }}>Often $180-$400/hr</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>X</span>
              </div>
            </div>

            {/* Unlimited Text Support */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="font-medium" style={{ color: '#353535' }}>
                Unlimited Text Support
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                <span style={{ color: '#353535' }}>✓</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>Limited</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>X</span>
              </div>
            </div>

            {/* Personalized Remedies Included */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="font-medium" style={{ color: '#353535' }}>
                Personalized Remedies Included
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                <span style={{ color: '#353535' }}>✓</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>X</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>X</span>
              </div>
            </div>

            {/* Cost of Remedies */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="font-medium" style={{ color: '#353535' }}>
                Cost of Remedies
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                <span style={{ color: '#353535' }}>150</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span className="text-sm" style={{ color: '#535353' }}>Varies ($200-$500/mo)</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span className="text-sm" style={{ color: '#535353' }}>$350-$1200/mo</span>
              </div>
            </div>

            {/* Additional Product Discounts */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="font-medium" style={{ color: '#353535' }}>
                Additional Product Discounts
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                <span style={{ color: '#353535' }}>20%+ off</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>Full Retail Price</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>Full Retail Price</span>
              </div>
            </div>

            {/* Bath/Body/Food/Tea Products */}
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="font-medium" style={{ color: '#353535' }}>
                Bath/Body/Food/Tea Products
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                <span style={{ color: '#353535' }}>Included</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>X</span>
              </div>
              <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                <span style={{ color: '#535353' }}>X</span>
              </div>
            </div>

              {/* Focus on Prevention */}
              <div className="grid grid-cols-4 gap-4 items-center">
                <div className="font-medium" style={{ color: '#353535' }}>
                  Focus on Prevention
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span style={{ color: '#353535' }}>✓</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>✓</span>
                </div>
                <div className="h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'white' }}>
                  <span style={{ color: '#535353' }}>X</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet View - Cards */}
          <div className="lg:hidden space-y-4 sm:space-y-6">
            {/* Video Consults Card */}
            <div className="bg-white p-4 rounded-lg">
              <div className="font-medium mb-3 text-base" style={{ color: '#353535' }}>Video Consults</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#535353' }}>Ambe:</span>
                  <span className="text-sm font-medium" style={{ color: '#353535' }}>1 hr/month included</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#535353' }}>Pay-As-You-Like:</span>
                  <span className="text-sm" style={{ color: '#535353' }}>$180-$400/hr</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#535353' }}>Typical:</span>
                  <span className="text-sm" style={{ color: '#535353' }}>Not included</span>
                </div>
              </div>
            </div>

            {/* Text Support Card */}
            <div className="bg-white p-4 rounded-lg">
              <div className="font-medium mb-3 text-base" style={{ color: '#353535' }}>Unlimited Text Support</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#535353' }}>Ambe:</span>
                  <span className="text-sm font-medium" style={{ color: '#353535' }}>✓</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#535353' }}>Pay-As-You-Like:</span>
                  <span className="text-sm" style={{ color: '#535353' }}>Limited</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: '#535353' }}>Typical:</span>
                  <span className="text-sm" style={{ color: '#535353' }}>Not included</span>
                </div>
              </div>
            </div>

            {/* Other comparison cards would go here... */}
          </div>
        </div>
      </section>

      {/* Professional Comparison Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          {/* Desktop Grid View */}
          <div className="hidden lg:block overflow-x-auto">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-0">
            <div className="h-16 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Feature/Training Area</span>
            </div>
            <div className="h-16 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist</span>
            </div>
            <div className="h-16 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian (RD)</span>
            </div>
            <div className="h-16 border flex items-center px-4" style={{ backgroundColor: '#FFD3AC', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor</span>
            </div>
          </div>

          {/* Data Rows */}
          <div className="grid grid-cols-4 gap-0">
            {/* Educational Pathway */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Educational Pathway</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Varies widely (certificate to degree)</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Accredited BS/MS in Dietetics + 1200+ hrs supervised practice</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>5.5-year degree (BAMS) or equivalent, with internship in Ayurveda</span>
            </div>

            {/* Governing Body */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Governing Body / License</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>None or limited (not legally protected)</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Licensed by CDR (Commission on Dietetic Registration)</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Licensed by Ayurvedic Medical Boards (India and some global orgs)</span>
            </div>

            {/* Focus of Training */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Focus of Training</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>General nutrition, food science</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Clinical nutrition, disease-related dietary plans</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Mind-body-spirit nutrition, doshas, digestion, daily/life cycles (Dinacharya/Ritucharya)</span>
            </div>

            {/* Training in Herbs */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Training in Herbs & Botanicals</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Minimal to none</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Minimal (only within supplement guidelines)</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Extensive—hundreds of hours in herbal pharmacology, rasa, virya, vipaka</span>
            </div>

            {/* View of Food */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>View of Food</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Macronutrients & calories</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Macronutrient & micronutrient balance; pathology-based</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Food as medicine (Ahara), categorized by qualities, energetics, season, emotional effects</span>
            </div>

            {/* Personalization */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Personalization Approach</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Generic plans or macro-based diets</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Personalized to medical conditions</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Deeply individualized based on prakriti, vikriti, agni, and mental/emotional state</span>
            </div>

            {/* Understanding Digestion */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Understanding of Digestion</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Caloric intake, GI health (basic)</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Detailed GI pathologies, fiber, enzyme responses</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Agni theory, ama (toxicity), 13 types of digestive fire, subtle body digestion</span>
            </div>

            {/* Mind-Body Integration */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Mind-Body Integration</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Rarely addressed</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Minimal integration</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Central to diagnosis and treatment—mental gunas, emotional causation of imbalance</span>
            </div>

            {/* Spiritual Lens */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Spiritual/Ethical Lens</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Not included</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Not included</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Rooted in Vedic philosophy, karma, and ethics; food impacts consciousness</span>
            </div>

            {/* Treatment Modalities */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Treatment Modalities</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Diet plans, calorie tracking</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Medical nutrition therapy</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Food therapy + herbs, lifestyle routines, detox (Panchakarma), breath, meditation, rituals</span>
            </div>

            {/* Scope of Practice */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Scope of Practice</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Wellness support</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Disease prevention & management</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Holistic care across mental, physical, and spiritual domains</span>
            </div>

            {/* Time-Tested Tradition */}
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="font-medium text-sm" style={{ color: '#353535' }}>Time-Tested Tradition</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Modern (~50-100 years of development)</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Scientific framework from 20th century</span>
            </div>
            <div className="h-20 border flex items-center px-4" style={{ backgroundColor: 'white', borderColor: '#D3D3D3' }}>
              <span className="text-xs" style={{ color: '#535353' }}>Over 5,000 years of lineage-tested protocols</span>
            </div>
          </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden space-y-6">
            <div className={sectionTitleClasses + " text-center mb-6 text-xl sm:text-2xl"}>
              Professional Comparison
            </div>
            
            {/* Educational Pathway Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <div className="font-semibold mb-4 text-base sm:text-lg" style={{ color: '#353535', backgroundColor: '#FFD3AC', padding: '8px', borderRadius: '4px' }}>
                Educational Pathway
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Varies widely (certificate to degree)</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Accredited BS/MS in Dietetics + 1200+ hrs supervised practice</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>5.5-year degree (BAMS) or equivalent, with internship in Ayurveda</p>
                </div>
              </div>
            </div>

            {/* Governing Body Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <div className="font-semibold mb-4 text-base sm:text-lg" style={{ color: '#353535', backgroundColor: '#FFD3AC', padding: '8px', borderRadius: '4px' }}>
                Governing Body / License
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>None or limited (not legally protected)</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Licensed by CDR (Commission on Dietetic Registration)</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Licensed by Ayurvedic Medical Boards (India and some global orgs)</p>
                </div>
              </div>
            </div>

            {/* Focus of Training Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <div className="font-semibold mb-4 text-base sm:text-lg" style={{ color: '#353535', backgroundColor: '#FFD3AC', padding: '8px', borderRadius: '4px' }}>
                Focus of Training
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>General nutrition, food science</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Clinical nutrition, disease-related dietary plans</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Mind-body-spirit nutrition, doshas, digestion, daily/life cycles</p>
                </div>
              </div>
            </div>

            {/* Training in Herbs Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <div className="font-semibold mb-4 text-base sm:text-lg" style={{ color: '#353535', backgroundColor: '#FFD3AC', padding: '8px', borderRadius: '4px' }}>
                Training in Herbs & Botanicals
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Minimal to none</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Minimal (only within supplement guidelines)</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Extensive—hundreds of hours in herbal pharmacology</p>
                </div>
              </div>
            </div>

            {/* Additional cards for remaining categories - showing a few more for completeness */}
            
            {/* View of Food Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <div className="font-semibold mb-4 text-base sm:text-lg" style={{ color: '#353535', backgroundColor: '#FFD3AC', padding: '8px', borderRadius: '4px' }}>
                View of Food
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Macronutrients & calories</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Macronutrient & micronutrient balance; pathology-based</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Food as medicine, categorized by qualities, energetics, season</p>
                </div>
              </div>
            </div>

            {/* Time-Tested Tradition Card */}
            <div className="bg-white rounded-lg p-4 sm:p-6">
              <div className="font-semibold mb-4 text-base sm:text-lg" style={{ color: '#353535', backgroundColor: '#FFD3AC', padding: '8px', borderRadius: '4px' }}>
                Time-Tested Tradition
              </div>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Nutritionist:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Modern (~50-100 years of development)</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Registered Dietitian:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Scientific framework from 20th century</p>
                </div>
                <div>
                  <span className="font-medium text-sm" style={{ color: '#353535' }}>Ayurvedic Doctor:</span>
                  <p className="text-xs mt-1" style={{ color: '#535353' }}>Over 5,000 years of lineage-tested protocols</p>
                </div>
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
                  Join the Ambe Membership for personalized, all-inclusive care.
                </p>
                <Button>
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