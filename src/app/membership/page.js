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
      <section className="relative h-[75vh] flex items-center overflow-hidden">
        {/* Video Background */}
        <VideoBackground />
        
        <div className="relative w-full flex justify-center">
          <div className="w-full max-w-7xl px-8 lg:px-16">
            <div className="max-w-3xl">
              <div className={bannerTitleClasses + " mb-4 leading-tight"} style={{ color: 'white' }}>
                Your Wellness. Fully Covered.
              </div>
              <p className="text-white mb-8 text-xl font-light" style={{ color: 'white' }}>
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
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8">
          {/* Title */}
          <div className={sectionTitleClasses + " text-center mb-16"}>
            What You Get
          </div>

          {/* Icons Row */}
          <div className="flex justify-center items-center gap-8 mb-16">
            {/* Personalized Wellness Plan */}
            <div className="w-48 h-48 rounded-full bg-white flex flex-col items-center justify-center p-6">
              <span className="text-4xl mb-2" style={{ color: '#FFD3AC' }}>📋</span>
              <p className="text-base text-center" style={{ color: '#353535' }}>
                Personalized<br />
                Wellness Plan <span className="text-sm">✓</span>
              </p>
            </div>

            {/* Unlimited Texting */}
            <div className="w-48 h-48 rounded-full bg-white flex flex-col items-center justify-center p-6">
              <span className="text-4xl mb-2" style={{ color: '#FFD3AC' }}>💬</span>
              <p className="text-base text-center" style={{ color: '#353535' }}>
                Unlimited<br />
                Texting <span className="text-sm">✓</span>
              </p>
            </div>

            {/* 1 Hour Video Call Monthly - Center/Highlighted */}
            <div className="w-56 h-56 rounded-full flex flex-col items-center justify-center px-8" style={{ backgroundColor: '#FFD3AC' }}>
              <span className="text-5xl mb-3" style={{ color: '#353535' }}>📱</span>
              <p className="text-xl font-medium mb-2 text-center" style={{ color: '#353535' }}>
                1 Hour Video Call<br />
                Monthly
              </p>
              <p className="text-base text-center" style={{ color: '#353535' }}>
                Get the attention you<br />
                deserve
              </p>
            </div>

            {/* Remedies Included */}
            <div className="w-48 h-48 rounded-full bg-white flex flex-col items-center justify-center p-6">
              <span className="text-4xl mb-2" style={{ color: '#FFD3AC' }}>💊</span>
              <p className="text-base text-center" style={{ color: '#353535' }}>
                Remedies<br />
                Included
              </p>
            </div>

            {/* Bath, Body, Food & Tea Perks */}
            <div className="w-48 h-48 rounded-full bg-white flex flex-col items-center justify-center p-6">
              <span className="text-4xl mb-2" style={{ color: '#FFD3AC' }}>🍵</span>
              <p className="text-base text-center" style={{ color: '#353535' }}>
                Bath, Body,Food<br />
                & Tea Perks
              </p>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-2xl font-light text-center" style={{ color: '#353535' }}>
            Always 20%+ Discount on vitamins and minerals.
          </div>
        </div>
      </section>

      {/* No Surprises Section */}
      <section className="py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="text-center">
            <div className={sectionTitleClasses + " mb-8"}>
              No Surprises. Just Results
            </div>
            <p className="text-lg" style={{ color: '#535353' }}>
              Most wellness programs leave you with costly supplements and little support. We include everything you need so<br />
              you can focus on feeling your best.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex gap-16">
            {/* Left Column - Pricing */}
            <div className="flex-1">
              <div className={sectionTitleClasses + " mb-12"}>
                Pricing
              </div>
              
              {/* Ambe Membership Card */}
              <div 
                className="p-8 rounded-2xl mb-8"
                style={{ backgroundColor: 'white' }}
              >
                {/* Peach Header */}
                <div 
                  className="p-6 -m-8 mb-6 rounded-t-2xl text-center"
                  style={{ backgroundColor: '#FFD3AC' }}
                >
                  <div className="text-2xl font-medium mb-2" style={{ color: '#353535' }}>
                    Ambe Membership
                  </div>
                  <div className="text-3xl font-semibold" style={{ color: '#353535' }}>
                    $150 sign-up and $50<span className="text-lg">/month</span>
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
            <div className="flex-1">
              <div className={sectionTitleClasses + " mb-12"}>
                Pay-As-You-Like Plan
              </div>

              {/* Three Cards */}
              <div className="space-y-6">
                {/* Free first consult */}
                <div 
                  className="p-6 rounded-2xl flex items-center gap-6"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-20 h-20 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="20" y="15" width="40" height="30" rx="2" stroke="#FFD3AC" strokeWidth="2"/>
                      <circle cx="30" cy="30" r="5" stroke="#FFD3AC" strokeWidth="2"/>
                      <circle cx="50" cy="30" r="5" stroke="#FFD3AC" strokeWidth="2"/>
                      <path d="M25 55 Q40 65 55 55" stroke="#FFD3AC" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div className="text-xl" style={{ color: '#353535' }}>
                    Free first consult
                  </div>
                </div>

                {/* No text support */}
                <div 
                  className="p-6 rounded-2xl flex items-center gap-6"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-20 h-20 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <rect x="20" y="25" width="40" height="30" rx="4" stroke="#FFD3AC" strokeWidth="2"/>
                      <path d="M30 35 H50 M30 40 H45 M30 45 H50" stroke="#FFD3AC" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="text-xl" style={{ color: '#353535' }}>
                    No text support
                  </div>
                </div>

                {/* Products purchased separately */}
                <div 
                  className="p-6 rounded-2xl flex items-center gap-6"
                  style={{ backgroundColor: 'white' }}
                >
                  <div className="w-20 h-20 flex items-center justify-center">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                      <circle cx="35" cy="35" r="8" stroke="#FFD3AC" strokeWidth="2"/>
                      <text x="35" y="40" fill="#FFD3AC" textAnchor="middle" fontSize="16">$</text>
                      <circle cx="45" cy="45" r="8" stroke="#FFD3AC" strokeWidth="2"/>
                      <text x="45" y="50" fill="#FFD3AC" textAnchor="middle" fontSize="16">$</text>
                    </svg>
                  </div>
                  <div className="text-xl" style={{ color: '#353535' }}>
                    Products purchased separately
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className={sectionTitleClasses + " text-center mb-12"}>
            Comparison Grid
          </div>

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
      </section>

      {/* Professional Comparison Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
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
      </section>

      {/* CTA and Footer Section with Video Background */}
      <section className="relative">
        <VideoBackground />
        <div className="relative z-10">
          {/* Ready to Feel Your Best Section */}
          <div className="pt-24 pb-8">
            <div className="max-w-5xl mx-auto px-8">
              <div 
                className="py-10 px-12 text-center"
                style={{ 
                  backgroundColor: 'rgba(244, 244, 244, 0.7)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}
              >
                <div className={sectionTitleClasses + " mb-6"}>
                  Ready to Feel Your Best?
                </div>
                <p className="text-xl mb-8" style={{ color: '#535353' }}>
                  Join the Ambe Membership for personalized, all-inclusive care.
                </p>
                <Button>
                  BOOK NOW - PAY AS YOU LIKE
                </Button>
              </div>
            </div>
          </div>

          {/* Everyone Deserves Access Text */}
          <div className="text-center pt-8 pb-16">
            <p className="text-2xl" style={{ color: 'white' }}>
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