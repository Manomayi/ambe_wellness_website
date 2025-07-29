"use client";
import React from 'react';
import Link from 'next/link';
import { CheckIcon } from '@heroicons/react/24/solid';
import Button from '@/components/common/Button';
import VideoBackground from '@/components/common/VideoBackground';

export default function Home() {

  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 py-6 border-b border-white">
        <div className="max-w-7xl mx-auto lg:px-16">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <h1 className="text-4xl font-bold font-richmond" style={{ color: '#FFD3AC' }}>
              AMBE
            </h1>
            
            {/* Right side navigation */}
            <div className="flex items-center gap-12">
              <Link href="#" className="text-sm" style={{ color: 'white' }}>
                Enterprise
              </Link>
              <Link href="#" className="text-sm" style={{ color: 'white' }}>
                Membership
              </Link>
              <button className="border border-white px-6 py-2 rounded-full text-sm hover:bg-white hover:text-black transition-colors" style={{ color: 'white' }}>
                Download App
              </button>
              
              {/* Divider */}
              <div className="h-8 w-px bg-white opacity-50"></div>
              
              <Link href="/login" className="text-sm" style={{ color: 'white' }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Video Background */}
        <VideoBackground />
        
        {/* Dark Overlay - temporarily commented out for debugging */}
        {/* <div className="absolute inset-0 bg-black bg-opacity-50 z-10"></div> */}
        
        <div className="relative w-full flex justify-center">
          <div className="w-full max-w-7xl px-8 lg:px-16">
            <div className="max-w-3xl">
              <h1 className="text-6xl font-light mb-4 leading-tight text-white font-richmond" style={{ color: 'white' }}>
                Integrative-Doctor led care<br />Pay as you like
              </h1>
              <p className="text-white mb-2 text-xl font-light" style={{ color: 'white' }}>
                Evidence based holistic care with heart<br />
                Tailored only for you
              </p>
              <p className="text-white mb-8 text-base" style={{ color: 'white' }}>
                Tele-Wellness
              </p>
              <p className="text-white mb-8 text-base font-bold" style={{ color: 'white' }}>
                Developed at Stanford
              </p>
              
              <Button>
                BOOK NOW
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-light mb-2" style={{ color: '#353535' }}>Trusted by:</h2>
            <h3 className="text-5xl font-bold mb-4" style={{ color: '#353535' }}>American Apparel™</h3>
            <p className="text-lg" style={{ color: '#535353' }}>Pioneers In Corporate Wellness: A Better Way To Grow</p>
          </div>
          
          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* David Testimonial */}
            <div className="relative flex justify-center">
              <div className="rounded-full p-8 flex flex-col items-center" style={{ backgroundColor: '#FFD3AC', width: '400px', height: '400px' }}>
                <div className="w-16 h-16 bg-white rounded-full mb-3 flex-shrink-0"></div>
                <h4 className="text-lg font-semibold text-center mb-3 h-12 flex items-center" style={{ color: '#353535' }}>
                  Chief Strategy Officer,<br />National Tech Firm
                </h4>
                <p className="text-sm text-center leading-relaxed flex-1 flex items-start" style={{ color: '#353535' }}>
                  For the first time in 20 years of nonstop output, I found a wellness system that didn&apos;t just slow me down—it woke me up. Ambé&apos;s personalized protocols gave me energy I didn&apos;t know I was missing, and helped me show up sharper, calmer, and more focused than ever before.
                </p>
                <p className="text-center font-semibold mt-4" style={{ color: '#353535' }}>David</p>
              </div>
            </div>

            {/* Joshua Testimonial */}
            <div className="relative flex justify-center">
              <div className="rounded-full p-8 flex flex-col items-center" style={{ backgroundColor: '#FFD3AC', width: '400px', height: '400px' }}>
                <div className="w-16 h-16 bg-white rounded-full mb-3 flex-shrink-0"></div>
                <h4 className="text-lg font-semibold text-center mb-3 h-12 flex items-center" style={{ color: '#353535' }}>
                  Operations Supervisor,<br />Regional Distribution Center
                </h4>
                <p className="text-sm text-center leading-relaxed flex-1 flex items-start" style={{ color: '#353535' }}>
                  Between shift work and stress, I was running on empty. Ambé didn&apos;t hand me a generic plan—they listened. My sleep, digestion, and moods have all leveled out. I finally feel in control of my health, and my team noticed the difference too.
                </p>
                <p className="text-center font-semibold mt-4" style={{ color: '#353535' }}>Joshua</p>
              </div>
            </div>

            {/* Rosario Testimonial */}
            <div className="relative flex justify-center">
              <div className="rounded-full p-8 flex flex-col items-center" style={{ backgroundColor: '#FFD3AC', width: '400px', height: '400px' }}>
                <div className="w-16 h-16 bg-white rounded-full mb-3 flex-shrink-0"></div>
                <h4 className="text-lg font-semibold text-center mb-3 h-12 flex items-center" style={{ color: '#353535' }}>
                  Warehouse Associate,<br />National Retail Chain
                </h4>
                <p className="text-sm text-center leading-relaxed flex-1 flex items-start" style={{ color: '#353535' }}>
                  I never thought wellness was made for someone like me. Ambé changed that. They spoke my language, respected my time, and helped my body stop hurting every day. It&apos;s not just medicine—it&apos;s care that fits real life.
                </p>
                <p className="text-center font-semibold mt-4" style={{ color: '#353535' }}>Rosario</p>
              </div>
            </div>
          </div>

          {/* Bio-Markers Stats */}
          <div className="text-center">
            <p className="text-4xl" style={{ color: '#353535' }}>
              <span className="font-bold underline">55</span> <span className="font-light">Million Bio-Markers analysed</span>
            </p>
          </div>
        </div>
      </section>

      {/* Time Tested Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-4xl font-light text-center mb-6" style={{ color: '#353535' }}>
            Time Tested and Results Driven
          </div>
          <p className="text-center text-lg mb-16 max-w-5xl mx-auto" style={{ color: '#535353' }}>
            Dr. Google is scary. We get it. You&apos;ve tried the threads—the threads on the threads... It&apos;s time for something real, built around you. Clarity is a form of care.
          </p>
          
          {/* Three Columns */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Column 1 */}
            <div className="text-center bg-white p-6">
              <div className="mb-6 h-24 flex items-center justify-center">
                <div className="w-20 h-20 rounded-lg border-2" style={{ borderColor: '#FFD3AC' }}></div>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#353535' }}>
                Conflicted by fad-driven advice and<br />endless tests without real insight?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                Ambé cuts through the noise with time-tested, evidence-based care and real credentials—thousands of years of wisdom versus a few years of fragmented information in holistic medicine.
              </p>
            </div>

            {/* Column 2 */}
            <div className="text-center bg-white p-6">
              <div className="mb-6 h-24 flex items-center justify-center">
                <div className="w-20 h-20 rounded-lg border-2" style={{ borderColor: '#FFD3AC' }}></div>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#353535' }}>
                Tired of one-size-fits-all<br />supplements?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                At Ambé, every formula is tailored to your unique mind-body type. No algorithms. No shortcuts. Just real doctors creating real, time-tested protocols—just for you. We don&apos;t do &quot;standard.&quot; Ambé formulas are hand-built by doctors to reflect your specific constitution, habits, and environment. You deserve precision—not guesswork.
              </p>
            </div>

            {/* Column 3 */}
            <div className="text-center bg-white p-6">
              <div className="mb-6 h-24 flex items-center justify-center">
                <div className="w-20 h-20 rounded-lg border-2" style={{ borderColor: '#FFD3AC' }}></div>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#353535' }}>
                Being overcharged by underqualified,<br />self-professed experts?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                The human psychology of valuing only that which we pay a lot for can be remedied with proven results. By setting an example—by making high-quality health care available to everyone. We hope, that most will benefit.
              </p>
            </div>
          </div>

          {/* Book Now Button */}
          <div className="text-center">
            <Button className="mb-4">
              BOOK NOW
            </Button>
            <p className="text-sm" style={{ color: '#535353' }}>
              Two minutes. No commitment. Much clarity.
            </p>
          </div>
        </div>
      </section>

      {/* The Ambé Difference Section */}
      <section className="py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-5xl font-light mb-16" style={{ color: '#353535' }}>
            The Ambé Difference
          </div>

          {/* Three Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-32">
            {/* Precision You Can Trust */}
            <div className="p-6 flex items-center gap-4" style={{ backgroundColor: '#FFD3AC', borderRadius: '0 100px 0 100px', height: '140px' }}>
              <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7V12C2 17.5 5.25 22.5 12 24C18.75 22.5 22 17.5 22 12V7L12 2Z" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#353535' }}>
                  Precision You Can<br />Trust
                </h3>
                <p className="text-sm" style={{ color: '#353535' }}>
                  Doctors cross- trained in time tested and modern science
                </p>
              </div>
            </div>

            {/* Care You Can Feel */}
            <div className="p-6 flex items-center gap-4" style={{ backgroundColor: '#FFD3AC', borderRadius: '0 100px 0 100px', height: '140px' }}>
              <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10V7C7 6.46957 7.21071 5.96086 7.58579 5.58579C7.96086 5.21071 8.46957 5 9 5H15C15.5304 5 16.0391 5.21071 16.4142 5.58579C16.7893 5.96086 17 6.46957 17 7V10" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 11C5 10.4696 5.21071 9.96086 5.58579 9.58579C5.96086 9.21071 6.46957 9 7 9H17C17.5304 9 18.0391 9.21071 18.4142 9.58579C18.7893 9.96086 19 10.4696 19 11V13C19 17.4183 15.4183 21 11 21H9" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 5V9" stroke="#353535" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#353535' }}>
                  Care You Can<br />Feel
                </h3>
                <p className="text-sm" style={{ color: '#353535' }}>
                  Plans crafted around your whole self & labs
                </p>
              </div>
            </div>

            {/* Ethics You Can Stand Behind */}
            <div className="p-6 flex items-center gap-4" style={{ backgroundColor: '#FFD3AC', borderRadius: '0 100px 0 100px', height: '140px' }}>
              <div className="w-20 h-20 bg-white rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="2" width="8" height="4" rx="1" stroke="#353535" strokeWidth="2"/>
                  <path d="M16 6V10C16 10.7956 15.6839 11.5587 15.1213 12.1213C14.5587 12.6839 13.7956 13 13 13H11C10.2044 13 9.44129 12.6839 8.87868 12.1213C8.31607 11.5587 8 10.7956 8 10V6" stroke="#353535" strokeWidth="2"/>
                  <path d="M4 7H20" stroke="#353535" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M8 7V19C8 20.1046 8.89543 21 10 21H14C15.1046 21 16 20.1046 16 19V7" stroke="#353535" strokeWidth="2"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1" style={{ color: '#353535' }}>
                  Ethics You Can Stand<br />Behind
                </h3>
                <p className="text-sm" style={{ color: '#353535' }}>
                  Fair-trade sourcing, real transparency
                </p>
              </div>
            </div>
          </div>

          {/* Circular Diagram Section */}
          <div className="relative">
            <div className="flex items-center">
              {/* White circle with text content - all the way to the left */}
              <div className="bg-white rounded-full p-14 flex flex-col justify-center text-center shadow-lg w-[500px] h-[500px] flex-shrink-0">
                <h3 className="text-2xl font-semibold mb-6" style={{ color: '#353535' }}>
                  1. Clinical Precision
                </h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold mb-2" style={{ color: '#353535' }}>What We Do</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                    Doctors trained in traditional and ayurvedic medicine and modern integrative science. Recognize interactions between herbal and pharmaceutical protocols.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2" style={{ color: '#353535' }}>Why It Matters</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#535353' }}>
                    Prevents serious side effects from poor combinations (e.g., SSRIs + Brahmi, beta-blockers + Ashwagandha, blood thinners + turmeric).
                  </p>
                </div>
              </div>
              
              {/* Arc segments image - bigger and close to the right of circle */}
              <img 
                src="/arc_segments.png" 
                alt="Arc Segments" 
                className="w-[800px] h-[800px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section - no title */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-x-32 gap-y-16">
            {/* Left Column - Steps 1 & 2 */}
            <div className="space-y-16">
              {/* Step 1 - Book */}
              <div className="flex items-center gap-8">
                <img 
                  src="/step1.png" 
                  alt="Step 1" 
                  className="w-40 h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: '#353535' }}>Book</h3>
                  <p className="text-base leading-relaxed" style={{ color: '#535353' }}>
                    Book now, and fill out your secured details to be matched with a doctor specific to your unique needs.
                  </p>
                </div>
              </div>

              {/* Step 2 - Video Call */}
              <div className="flex items-center gap-8">
                <img 
                  src="/step2.png" 
                  alt="Step 2" 
                  className="w-40 h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: '#353535' }}>Video Call</h3>
                  <p className="text-base leading-relaxed" style={{ color: '#535353' }}>
                    Video chat with your specialist.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Steps 3 & 4 */}
            <div className="space-y-16">
              {/* Step 3 - Get Care + Unlimited Text */}
              <div className="flex items-center gap-8">
                <img 
                  src="/step3.png" 
                  alt="Step 3" 
                  className="w-40 h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: '#353535' }}>Get Care + Unlimited Text</h3>
                  <p className="text-base leading-relaxed" style={{ color: '#535353' }}>
                    Get customized diet, cleanse, lifestyle, exercise, yoga, and meditation plans by your specialist — plus unlimited texting.
                  </p>
                </div>
              </div>

              {/* Step 4 - Monthly Video Follow Up */}
              <div className="flex items-center gap-8">
                <img 
                  src="/step4.png" 
                  alt="Step 4" 
                  className="w-40 h-32 object-contain flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-2" style={{ color: '#353535' }}>Monthly Video Follow Up</h3>
                  <p className="text-base leading-relaxed" style={{ color: '#535353' }}>
                    Monthly video call — essential care takes persistence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Experts Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-5xl font-light text-center mb-4 text-charcoal">
            Meet the Experts
          </div>
          <p className="text-center text-lg mb-16 max-w-5xl mx-auto text-body">
            Licensed. Global. Guided by science. Every Ambé practitioner is trained in traditional medicine and modern clinical frameworks–bringing deep expertise to every personalized plan.
          </p>
          
          {/* Doctors Grid */}
          <div className="grid md:grid-cols-4 gap-6">
            {/* Dr. Smita Bhatia */}
            <div className="bg-white p-8 text-center">
              <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="text-xl font-semibold mb-1 text-charcoal">
                Dr. Smita Bhatia
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">
                Doctor of Ayurvedic
              </p>
              <p className="text-sm mb-1 text-body">
                Medicine and Surgery
              </p>
              <p className="text-sm font-medium text-charcoal">
                Oncology Director
              </p>
            </div>

            {/* Dr. Jeremy Stone */}
            <div className="bg-white p-8 text-center">
              <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="text-xl font-semibold mb-1 text-charcoal">
                Dr. Jeremy Stone
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">
                Doctor of Ayurvedic
              </p>
              <p className="text-sm mb-1 text-body">
                Medicine and Surgery
              </p>
              <p className="text-sm font-medium text-charcoal">
                Metabolic and
              </p>
              <p className="text-sm font-medium text-charcoal">
                musculoskeletal specialist
              </p>
            </div>

            {/* Dr. Anandibai Joshi */}
            <div className="bg-white p-8 text-center">
              <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="text-xl font-semibold mb-1 text-charcoal">
                Dr. Anandibai Joshi
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">
                Doctor of Ayurvedic
              </p>
              <p className="text-sm mb-1 text-body">
                Medicine and Surgery
              </p>
              <p className="text-sm font-medium text-charcoal">
                Psychology specialist
              </p>
            </div>

            {/* Dr. Indira Hinduja */}
            <div className="bg-white p-8 text-center">
              <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="text-xl font-semibold mb-1 text-charcoal">
                Dr. Indira Hinduja
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">
                Doctor of Ayurvedic
              </p>
              <p className="text-sm mb-1 text-body">
                Medicine and Surgery
              </p>
              <p className="text-sm font-medium text-charcoal">
                OBGYN and women's health
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* How We Compare Section */}
      <section className="py-20 bg-grid-box">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-5xl font-light mb-4 text-charcoal">
            How We Compare
          </div>
          <p className="text-lg mb-16 text-body">
            No hidden fees, ever.
          </p>
          
          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 pr-8 font-normal"></th>
                  <th className="px-6 py-4">
                    <div className="text-4xl font-bold text-[#FFD3AC]">AMBE</div>
                  </th>
                  <th className="px-6 py-4 text-center font-normal text-charcoal">
                    OUR<br />COMPETITORS
                  </th>
                  <th className="px-6 py-4 text-center font-normal text-charcoal">
                    OTHERS
                  </th>
                  <th className="px-6 py-4 text-center font-normal text-charcoal">
                    NUTRITIONIST
                  </th>
                  <th className="px-6 py-4 text-center font-normal text-charcoal">
                    BIOMARKER<br />RESULTS
                  </th>
                  <th className="px-6 py-4 text-center font-normal text-charcoal">
                    GENE RESULTS
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Integrative Doctors */}
                <tr className="border-t border-gray-200">
                  <td className="py-6 pr-8 text-lg text-charcoal">
                    Integrative Doctors
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-16 rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-6 h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-charcoal">$ 500/Visit</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                </tr>

                {/* 1 on 1 Video */}
                <tr className="border-t border-gray-200">
                  <td className="py-6 pr-8 text-lg text-charcoal">
                    1 on 1 Video
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-16 rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-6 h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-charcoal">$ 500/Visit</td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-16 rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-6 h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                </tr>

                {/* Unlimited Texting */}
                <tr className="border-t border-gray-200">
                  <td className="py-6 pr-8 text-lg text-charcoal">
                    Unlimited Texting
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-16 rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-6 h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                </tr>

                {/* Time Tested */}
                <tr className="border-t border-gray-200">
                  <td className="py-6 pr-8 text-lg text-charcoal">
                    Time Tested
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-16 rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-6 h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-charcoal">Infrequently</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                </tr>

                {/* Bio markers tested */}
                <tr className="border-t border-gray-200">
                  <td className="py-6 pr-8 text-lg text-charcoal">
                    Bio markers tested
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center px-4 py-3 rounded-2xl bg-[#FFD3AC]">
                      <span className="text-sm text-charcoal">100 tests = $100</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-sm text-charcoal">100 tests =<br />min $300</td>
                  <td className="px-6 py-6 text-center text-charcoal">$250</td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center justify-center w-32 h-16 rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-6 h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center text-xl text-charcoal">X</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="relative">
        <VideoBackground />
        <div className="relative z-10 py-8">
          <div className="max-w-7xl mx-auto px-8">
            {/* First row - navigation links */}
            <div className="flex justify-between mb-4">
              <Link href="/enterprise" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
                Enterprise
              </Link>
              <Link href="/membership" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
                Membership
              </Link>
              <Link href="/download" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
                Download App
              </Link>
              <Link href="/signin" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
                Sign In
              </Link>
              <Link href="/contact" style={{ color: 'white' }} className="hover:opacity-80 transition-opacity">
                Contact
              </Link>
            </div>
            
            {/* Second row - copyright and terms */}
            <div className="flex justify-between items-center">
              <p style={{ color: 'white' }} className="text-sm">
                2025 Ambe All Rights Reserved
              </p>
              <Link href="/terms" style={{ color: 'white' }} className="text-sm hover:opacity-80 transition-opacity">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

