"use client";
import React from 'react';
import Button from '@/components/common/Button';
import VideoBackground from '@/components/common/VideoBackground';
import Navigation from '@/components/navigation/Navigation';
import { sectionTitleClasses, bannerTitleClasses } from '@/lib/styles/constants';
import Footer from '@/components/common/Footer';

export default function Resources() {
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
              <div className={bannerTitleClasses + " mb-6 leading-tight"} style={{ color: 'white' }}>
                If you think living healthy is expensive, try living unhealthy.
              </div>
              <p className="text-white mb-6 text-sm sm:text-base md:text-lg font-light leading-relaxed" style={{ color: 'white' }}>
                Self-care is the highest expression of love for yourself, your family, your pets. Prevention is king. 
                At Ambé, we believe that care begins before illness takes over. Many chronic diseases—from 
                diabetes and kidney failure to inflammation, cancer, autoimmunity, and parasitic infections—are 
                preventable.
              </p>
              <p className="text-white mb-8 text-sm sm:text-base md:text-lg font-light" style={{ color: 'white' }}>
                Eating well, detoxifying the body, and minimizing exposure to toxins and plastics can 
                significantly reduce these risks. Let&apos;s reframe health as an act of love.
              </p>
              
              <Button>
                DOWNLOAD FREE EBOOK
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Health Priorities Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className={sectionTitleClasses + " text-center mb-8 sm:mb-10 md:mb-12 text-xl sm:text-2xl md:text-3xl lg:text-4xl px-4"}>
            Health begins with priorities that sustain life:
          </div>
          
          {/* Grid of health priorities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 md:mb-12">
            {/* Air Card */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded text-center" style={{ backgroundColor: '#FFD3AC', color: '#353535' }}>
                Air - Survival: ~3 Minutes
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Risks:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Urban smog, industrial toxins, VOCs from paints, mold spores.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Health Impact:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Respiratory disease, hormone disruption, cognitive decline.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Remediation:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        HEPA + Carbon Air Purifiers: Coway Airmega, Shark NeverChange.
                      </p>
                      <p className="text-sm" style={{ color: '#535353' }}>
                        UV HVAC systems and proper ventilation.
                      </p>
                      <p className="text-sm" style={{ color: '#535353' }}>
                        Indoor Plants: Snake Plant, Peace Lily, Boston Fern.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Water Card */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded text-center" style={{ backgroundColor: '#FFD3AC', color: '#353535' }}>
                Water - Survival: 3-5 Days
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Risks:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Heavy metals, PFAS, nitrates, microbial contamination.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Health Impact:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Kidney damage, endocrine disruption, GI illness.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Remediation:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Multi-stage filtration: Reverse Osmosis + Activated Carbon + UV.
                      </p>
                      <p className="text-sm" style={{ color: '#535353' }}>
                        Brands: Berkey Gravity Filters, Aquasana, iSpring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Food Card */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded text-center" style={{ backgroundColor: '#FFD3AC', color: '#353535' }}>
                Food - Survival: 2-3 Months
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Risks:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Processed foods high in HFCS, seed oils, additives.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Health Impact:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Chronic inflammation, obesity, diabetes, autoimmune risk.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Remediation:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Whole, organic, seasonal food choices.
                      </p>
                      <p className="text-sm" style={{ color: '#535353' }}>
                        Healthy fats: Olive oil, avocado oil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Environment Card */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6 px-3 sm:px-4 py-2 rounded text-center" style={{ backgroundColor: '#FFD3AC', color: '#353535' }}>
                Environment - Chronic Impact
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Risks:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        High-pollution zones, proximity to chemical facilities, unsafe social settings.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Health Impact:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Increased toxin exposure, crime risk, stress load.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                    <div>
                      <div className="font-semibold mb-2">Remediation:</div>
                      <p className="text-sm mt-1" style={{ color: '#535353' }}>
                        Choose toxin-free communities, access to nature.
                      </p>
                      <p className="text-sm" style={{ color: '#535353' }}>
                        Reduce indoor toxins: Non-toxic paint, natural cleaners.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mind & Emotions Card - Full Width */}
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12">
            <div className="text-xl font-semibold mb-6 px-4 py-2 rounded text-center" style={{ backgroundColor: '#FFD3AC', color: '#353535' }}>
              Mind & Emotions - Lifelong Impact
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                  <div>
                    <div className="font-semibold mb-2">Risks:</div>
                    <p className="text-sm mt-1" style={{ color: '#535353' }}>
                      Chronic stress, isolation, hostile environments.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                  <div>
                    <div className="font-semibold mb-2">Health Impact:</div>
                    <p className="text-sm mt-1" style={{ color: '#535353' }}>
                      Increased toxin exposure, crime risk, stress load.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-start gap-4" style={{ color: '#353535' }}>
                  <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-1" style={{ backgroundColor: '#FFD3AC', color: 'white', fontSize: '10px' }}>✓</span>
                  <div>
                    <div className="font-semibold mb-2">Remediation:</div>
                    <p className="text-sm mt-1" style={{ color: '#535353' }}>
                      Hugging 20 seconds reduces cortisol, increases oxytocin.
                    </p>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Build social connection, daily mindfulness practice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <div className="text-center">
            <Button>
              DOWNLOAD FULL GUIDE
            </Button>
          </div>
        </div>
      </section>

      {/* Guide Library Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className={sectionTitleClasses + " text-center mb-8 sm:mb-10 md:mb-12 text-xl sm:text-2xl md:text-3xl lg:text-4xl px-4"}>
            Guide Library
          </div>
          
          {/* Grid of guide cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Body & Personal Care */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">🧴</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Body & Personal Care
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Avoid</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Parabens, SLS, phthalates, synthetic fragrances.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Clean Brands</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      OSEA, True Botanicals, Dr. Hauschka, Cleo+Coco.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Body Care Red Flag List
              </a>
            </div>

            {/* Food & Nutrition */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">🍕</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Food & Nutrition
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Avoid</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      HFCS, seed oils, preservatives
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Choose</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Whole, seasonal foods.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Toxic Food Ingredients & Safe Choices
              </a>
            </div>

            {/* Home & Environmental Safety */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">🏠</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Home & Environmental Safety
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Avoid</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Bleach, VOCs, BPA.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Brands</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Seventh Generation, AspenClean.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Home Detox Checklist
              </a>
            </div>

            {/* Pets: Safe Nutrition */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">🐕</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Pets: Safe Nutrition
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Avoid</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Ultra-processed kibble.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Brands</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      JustFoodForDogs, Nom Nom, Open Farm.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Safe Pet Nutrition Guide
              </a>
            </div>

            {/* Cleansing & Detox Protocols */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">🧘</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Cleansing & Detox Protocols
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Colon</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Triphala, psyllium.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Liver</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Ghee flush.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Seasonal Cleanse Guide
              </a>
            </div>

            {/* Fasting & Autophagy */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">⏱️</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Fasting & Autophagy
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Benefits</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Cellular cleanup, anti-inflammatory.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Fasting Blueprint
              </a>
            </div>

            {/* Pharmaceutical Risks */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">💊</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Pharmaceutical Risks
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Concerns</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Ibuprofen, antacids.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Natural Alternatives</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Turmeric, Boswellia
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Medication Risk Sheet
              </a>
            </div>

            {/* Global Healing & Retreat Centers */}
            <div className="bg-white rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD3AC' }}>
                  <span className="text-xl sm:text-2xl">🌍</span>
                </div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: '#353535' }}>
                  Global Healing & Retreat Centers
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>India</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Raju Ayurveda, Vaidyagrama.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span style={{ color: '#FFD3AC' }}>●</span>
                  <div>
                    <div className="font-medium" style={{ color: '#353535' }}>Mexico</div>
                    <p className="text-sm" style={{ color: '#535353' }}>
                      Son de Eve.
                    </p>
                  </div>
                </div>
              </div>
              
              <a href="#" className="text-sm underline hover:opacity-80" style={{ color: '#FFD3AC' }}>
                Download Healing Centers Directory
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section with Video Background */}
      <section className="relative overflow-hidden">
        {/* Video Background */}
        <VideoBackground />
        
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]"></div>
        
        <div className="relative z-10">
          {/* Logo Circles Section */}
          <div className="py-16 sm:py-20 md:py-24">
            <div className="max-w-5xl mx-auto px-6 sm:px-8">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-12 md:gap-16 lg:gap-20">
                {/* Yuka Logo - White Circle */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <img 
                    src="/yuka.png" 
                    alt="Yuka"
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
                  />
                </div>
                
                {/* Picky Logo - With circular mask */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    src="/picky.png" 
                    alt="Picky"
                    className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 object-cover"
                  />
                </div>
                
                {/* EWG Logo - White Circle */}
                <div className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <img 
                    src="/ewg.png" 
                    alt="EWG"
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Disclaimer Section */}
          <div className="py-12 sm:py-16 md:py-20">
            <div className="max-w-7xl mx-auto px-6 sm:px-8">
              <div 
                className="py-8 sm:py-10 px-6 sm:px-8 md:px-12"
                style={{ 
                  backgroundColor: 'rgba(244, 244, 244, 0.9)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}
              >
                <div className={sectionTitleClasses + " text-center mb-6 sm:mb-8 text-xl sm:text-2xl md:text-3xl lg:text-4xl"}>
                  AMBE Wellness Disclaimer
                </div>
                
                <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
                  <p className="text-sm sm:text-base text-center leading-relaxed px-4" style={{ color: '#535353' }}>
                    All content and resources provided by AMBE are intended for **educational purposes only**. They do not constitute 
                    medical advice, diagnosis, or treatment. Any cleanse, detox program, or health regimen should be undertaken only under 
                    the supervision of AMBE&apos;s team of qualified wellness practitioners or other vetted professionals with appropriate experience**.
                  </p>
                  
                  <p className="text-sm sm:text-base text-center leading-relaxed px-4" style={{ color: '#535353' }}>
                    This ensures that your individual constitution (&quot;Prakriti&quot;), health status, and unique needs are addressed safely.
                  </p>
                  
                  <p className="text-sm sm:text-base text-center leading-relaxed px-4" style={{ color: '#535353' }}>
                    Improper or unsupervised application of these protocols can lead to harm. Always consult your licensed healthcare provider 
                    before starting any new wellness or cleansing program. By using AMBE resources, you acknowledge and 
                    accept that you are responsible for your own health decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </section>
      
    </div>
  );
}