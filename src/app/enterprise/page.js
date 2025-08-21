"use client";
import React from 'react';
import Image from 'next/image';
import Button from '@/components/common/Button';
import VideoBackground from '@/components/common/VideoBackground';
import Navigation from '@/components/navigation/Navigation';
import { sectionTitleClasses, bannerTitleClasses, sectionTitleWhiteClasses } from '@/lib/styles/constants';
import Footer from '@/components/common/Footer';

export default function Enterprise() {
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
                Pioneers of Corporate Wellness
              </div>
              <p className="text-white mb-8 text-xl font-light" style={{ color: 'white' }}>
                We led the way before &apos;employee experience&apos; was a buzzword. When 
                companies needed an edge, we delivered relief, support, and 
                transformative wellness for everyone—from the loading dock to the 
                executive suite.
              </p>
              
              <Button variant="light">
                GET STARTED
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Proven Track Record Section */}
      <section className="py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center gap-16">
            {/* Left Content */}
            <div className="flex-1">
              <div className={sectionTitleClasses + " mb-8"}>
                Proven Track Record
              </div>
              <p className="text-lg leading-relaxed" style={{ color: '#535353' }}>
                We pioneered large-scale corporate wellness with a track record 
                that speaks for itself. At American Apparel, we delivered 
                personalized care to over 5,000 employees during one of the 
                industry's most demanding periods—improving retention, morale, 
                and culture across a highly diverse workforce. From warehouse 
                workers who started their day with a Red Bull and a tamale to top 
                executives, our tailored approach delivered immediate, 
                measurable results.
              </p>
            </div>

            {/* Right Content - Doctor image with unique corner styling */}
            <div className="flex-1 relative">
              <div 
                className="relative h-[300px] overflow-hidden"
                style={{
                  borderTopLeftRadius: '0px',      // Square (90 degrees)
                  borderTopRightRadius: '120px',   // Very rounded
                  borderBottomRightRadius: '0px',  // Square (90 degrees)
                  borderBottomLeftRadius: '120px'  // Very rounded
                }}
              >
                <Image
                  src="/images/enterprise/image51.png"
                  alt="Doctor with health metrics"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Programs Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center gap-16">
            {/* Left Content - Image with unique corner styling */}
            <div className="flex-1 relative">
              <div 
                className="relative h-[300px] overflow-hidden"
                style={{
                  borderTopLeftRadius: '0px',      // Square (90 degrees)
                  borderTopRightRadius: '120px',   // Very rounded
                  borderBottomRightRadius: '0px',  // Square (90 degrees)
                  borderBottomLeftRadius: '120px'  // Very rounded
                }}
              >
                <Image
                  src="/images/enterprise/mask_group.png"
                  alt="Team meeting"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1">
              <div className={sectionTitleClasses + " mb-8"}>
                Custom Programs for Complex Needs
              </div>
              <p className="text-lg leading-relaxed" style={{ color: '#535353' }}>
                We delivered during American Apparel's most turbulent period: 
                leadership upheavals, union negotiations, layoffs. Our tailored 
                wellness programs reduced friction and secured cohesion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Holistic Care Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          {/* Title and Subtitle */}
          <div className="text-center mb-16">
            <div className={sectionTitleClasses + " mb-4"}>
              Personalized, Holistic Care
            </div>
            <p className="text-lg" style={{ color: '#535353' }}>
              Our integrated approach ensures equitable, accessible wellness for all.
            </p>
          </div>

          {/* Three Cards Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Personalized Care */}
            <div className="bg-white p-8 text-center">
              <div className="mb-8 flex justify-center">
                <span className="text-6xl" style={{ color: '#FFD3AC' }}>🤲</span>
              </div>
              <div className="text-2xl font-semibold mb-4" style={{ color: '#353535' }}>
                Personalized care for every employee - not cookie cutter
              </div>
            </div>

            {/* Card 2 - Multilingual Instructors */}
            <div className="bg-white p-8 text-center">
              <div className="mb-8 flex justify-center">
                <span className="text-6xl" style={{ color: '#FFD3AC' }}>🗣️</span>
              </div>
              <div className="text-2xl font-semibold mb-4" style={{ color: '#353535' }}>
                Multilingual instructors and culturally attuned offerings
              </div>
              <p className="text-base" style={{ color: '#535353' }}>
                (including classes in Mandarin, Spanish, and more)
              </p>
            </div>

            {/* Card 3 - Holistic Modalities */}
            <div className="bg-white p-8 text-center">
              <div className="mb-8 flex justify-center">
                <span className="text-6xl" style={{ color: '#FFD3AC' }}>🌿</span>
              </div>
              <div className="text-2xl font-semibold mb-4" style={{ color: '#353535' }}>
                A broad range of holistic modalities—from wellness tech to movement-based therapies
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Corporate Integration Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center gap-16">
            {/* Left Content */}
            <div className="flex-1">
              <div className={sectionTitleClasses + " mb-8"}>
                Community & Corporate Integration
              </div>
              <p className="text-lg leading-relaxed" style={{ color: '#535353' }}>
                Our dedicated community arts and wellness center near 
                American Apparel's headquarters wasn't just an add-on—it was an 
                essential part of our approach. By bridging the workplace and the 
                surrounding community, we deepened trust, built connection, and 
                delivered lasting impact during a time of extraordinary change.
              </p>
            </div>

            {/* Right Image */}
            <div className="flex-1">
              <div 
                className="relative h-[300px] overflow-hidden"
                style={{
                  borderTopLeftRadius: '0px',      // Square (90 degrees)
                  borderTopRightRadius: '120px',   // Very rounded
                  borderBottomRightRadius: '0px',  // Square (90 degrees)
                  borderBottomLeftRadius: '120px'  // Very rounded
                }}
              >
                <Image
                  src="/images/enterprise/cc_integration.png"
                  alt="Community and corporate integration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legacy & Evolution Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center gap-16">
            {/* Left Image */}
            <div className="flex-1">
              <div 
                className="relative h-[300px] overflow-hidden"
                style={{
                  borderTopLeftRadius: '120px',    // Very rounded
                  borderTopRightRadius: '0px',     // Square (90 degrees)
                  borderBottomRightRadius: '120px', // Very rounded
                  borderBottomLeftRadius: '0px'    // Square (90 degrees)
                }}
              >
                <Image
                  src="/images/enterprise/image38.png"
                  alt="Legacy and evolution team"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1">
              <div className={sectionTitleClasses + " mb-8"}>
                Legacy & Evolution
              </div>
              <p className="text-lg leading-relaxed" style={{ color: '#535353' }}>
                Our work at American Apparel left a lasting mark. The impact was 
                so strong their former HR Director joined our team, validating our 
                approach. As the world changed, so did we—adapting our proven 
                model for both digital delivery and in-person community studios 
                to ensure lasting, resilient wellness support wherever it's needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bring Ambe to Your Company Section */}
      <section className="py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <div className="flex items-center gap-16">
            {/* Left Content */}
            <div className="flex-1 flex flex-col justify-center">
              <div className={sectionTitleClasses + " mb-8"}>
                Bring Ambe to Your Company
              </div>
              <p className="text-lg leading-relaxed" style={{ color: '#535353' }}>
                We offer high-impact, cost-effective wellness programs designed 
                to deliver real results for organizations.
              </p>
            </div>

            {/* Right Benefits */}
            <div className="flex-1 space-y-8">
              {/* Benefit 1 */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  <span className="text-2xl">🎯</span>
                </div>
                <p className="text-base leading-relaxed pt-2" style={{ color: '#535353' }}>
                  Fully customized solutions tailored to your workforce
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  <span className="text-2xl">💰</span>
                </div>
                <p className="text-base leading-relaxed pt-2" style={{ color: '#535353' }}>
                  Lean, high-return services that maximize value
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-base leading-relaxed pt-2" style={{ color: '#535353' }}>
                  Benefits that support your entire team, from frontline 
                  staff to top leadership
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA and Footer Section with Video Background */}
      <section className="relative">
        <VideoBackground />
        <div className="relative z-10">
          {/* Let's Design a New Standard Section */}
          <div className="pt-24 pb-12">
            <div className="max-w-5xl mx-auto px-8">
              <div 
                className="py-16 px-12 text-center"
                style={{ 
                  backgroundColor: 'rgba(244, 244, 244, 0.7)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}
              >
                <div className={sectionTitleClasses + " mb-8"}>
                  Let's Design a New Standard
                </div>
                <p className="text-xl mb-12 max-w-3xl mx-auto" style={{ color: '#535353' }}>
                  Ready to raise the bar? Contact us to see how Ambé can become your next-gen wellness partner—transforming 
                  your strategy to elevate culture, retention, performance, and ROI.
                </p>
                <Button>
                  CONTACT US
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="pb-20">
            <div className="max-w-5xl mx-auto px-8">
              <div 
                className="py-16 px-12" 
                style={{ 
                  backgroundColor: 'rgba(244, 244, 244, 0.7)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}>
                <div className={sectionTitleClasses + " text-center mb-4"}>
                  Contact
                </div>
                <p className="text-center mb-12" style={{ color: '#535353' }}>
                  Drop us a line for a complementary guide for your team
                </p>
                
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <input
                        type="text"
                        placeholder="Name *"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-peach"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Company *"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-peach"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <input
                        type="email"
                        placeholder="Email *"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-peach"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone (optional)"
                        className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-peach"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <textarea
                      placeholder="Message *"
                      rows="6"
                      className="w-full px-4 py-3 rounded-lg bg-white border border-gray-200 focus:outline-none focus:border-peach resize-none"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="text-center">
                    <Button type="submit">
                      SEND INQUIRY
                    </Button>
                  </div>
                </form>
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