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
      <section className="relative min-h-[75vh] flex items-center overflow-hidden py-20">
        {/* Video Background */}
        <VideoBackground />
        
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        
        <div className="relative z-20 w-full flex justify-center">
          <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-16">
            <div className="max-w-3xl">
              <div className={bannerTitleClasses + " mb-4 leading-tight text-3xl sm:text-4xl md:text-5xl xl:text-6xl"} style={{ color: 'white' }}>
                Pioneers of Corporate Wellness
              </div>
              <p className="text-white mb-8 text-base sm:text-lg md:text-xl font-light" style={{ color: 'white' }}>
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
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#E5E5E5' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
            {/* Left Content */}
            <div className="w-full lg:flex-1">
              <div className={sectionTitleClasses + " mb-6 lg:mb-8 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Proven Track Record
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center lg:text-left" style={{ color: '#535353' }}>
                We pioneered large-scale corporate wellness with a track record 
                that speaks for itself. At American Apparel, we delivered 
                personalized care to over 5,000 employees during one of the 
                industry&apos;s most demanding periods—improving retention, morale, 
                and culture across a highly diverse workforce. From warehouse 
                workers who started their day with a Red Bull and a tamale to top 
                executives, our tailored approach delivered immediate, 
                measurable results.
              </p>
            </div>

            {/* Right Content - Doctor image with unique corner styling */}
            <div className="w-full lg:flex-1 relative">
              <div 
                className="relative h-[250px] sm:h-[300px] md:h-[350px] xl:h-[300px] overflow-hidden mx-auto max-w-md lg:max-w-none"
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
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
            {/* Left Content - Image with unique corner styling */}
            <div className="w-full lg:flex-1 relative">
              <div 
                className="relative h-[250px] sm:h-[300px] md:h-[350px] xl:h-[300px] overflow-hidden mx-auto max-w-md lg:max-w-none"
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
            <div className="w-full lg:flex-1">
              <div className={sectionTitleClasses + " mb-6 lg:mb-8 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Custom Programs for Complex Needs
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center lg:text-left" style={{ color: '#535353' }}>
                We delivered during American Apparel&apos;s most turbulent period: 
                leadership upheavals, union negotiations, layoffs. Our tailored 
                wellness programs reduced friction and secured cohesion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Holistic Care Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          {/* Title and Subtitle */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className={sectionTitleClasses + " mb-4 text-2xl sm:text-3xl md:text-4xl"}>
              Personalized, Holistic Care
            </div>
            <p className="text-base sm:text-lg px-4 sm:px-0" style={{ color: '#535353' }}>
              Our integrated approach ensures equitable, accessible wellness for all.
            </p>
          </div>

          {/* Three Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 - Personalized Care */}
            <div className="bg-white p-6 sm:p-8 text-center">
              <div className="mb-6 sm:mb-8 flex justify-center">
                <Image
                  src="/images/enterprise/holistic-care-1.png"
                  alt="Personalized care"
                  width={60}
                  height={60}
                  className="w-12 h-12 sm:w-14 sm:h-14"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-4" style={{ color: '#353535' }}>
                Personalized care for every employee - not cookie cutter
              </div>
            </div>

            {/* Card 2 - Multilingual Instructors */}
            <div className="bg-white p-6 sm:p-8 text-center">
              <div className="mb-6 sm:mb-8 flex justify-center">
                <Image
                  src="/images/enterprise/holistic-care-2.png"
                  alt="Multilingual instructors"
                  width={60}
                  height={60}
                  className="w-12 h-12 sm:w-14 sm:h-14"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-4" style={{ color: '#353535' }}>
                Multilingual instructors and culturally attuned offerings
              </div>
              <p className="text-sm" style={{ color: '#535353' }}>
                (including classes in Mandarin, Spanish, and more)
              </p>
            </div>

            {/* Card 3 - Holistic Modalities */}
            <div className="bg-white p-6 sm:p-8 text-center sm:col-span-2 lg:col-span-1">
              <div className="mb-6 sm:mb-8 flex justify-center">
                <Image
                  src="/images/enterprise/holistic-care-3.png"
                  alt="Holistic modalities"
                  width={60}
                  height={60}
                  className="w-12 h-12 sm:w-14 sm:h-14"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-4" style={{ color: '#353535' }}>
                A broad range of holistic modalities—from wellness tech to movement-based therapies
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Corporate Integration Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
            {/* Left Content */}
            <div className="w-full lg:flex-1 order-2 lg:order-1">
              <div className={sectionTitleClasses + " mb-6 lg:mb-8 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Community & Corporate Integration
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center lg:text-left" style={{ color: '#535353' }}>
                Our dedicated community arts and wellness center near 
                American Apparel&apos;s headquarters wasn&apos;t just an add-on—it was an 
                essential part of our approach. By bridging the workplace and the 
                surrounding community, we deepened trust, built connection, and 
                delivered lasting impact during a time of extraordinary change.
              </p>
            </div>

            {/* Right Image */}
            <div className="w-full lg:flex-1 order-1 lg:order-2">
              <div 
                className="relative h-[250px] sm:h-[300px] md:h-[350px] xl:h-[300px] overflow-hidden mx-auto max-w-md lg:max-w-none"
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
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
            {/* Left Image */}
            <div className="w-full lg:flex-1">
              <div 
                className="relative h-[250px] sm:h-[300px] md:h-[350px] xl:h-[300px] overflow-hidden mx-auto max-w-md lg:max-w-none"
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
            <div className="w-full lg:flex-1">
              <div className={sectionTitleClasses + " mb-6 lg:mb-8 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Legacy & Evolution
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center lg:text-left" style={{ color: '#535353' }}>
                Our work at American Apparel left a lasting mark. The impact was 
                so strong their former HR Director joined our team, validating our 
                approach. As the world changed, so did we—adapting our proven 
                model for both digital delivery and in-person community studios 
                to ensure lasting, resilient wellness support wherever it&apos;s needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bring Ambe to Your Company Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: '#F4F4F4' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
            {/* Left Content */}
            <div className="w-full lg:flex-1 flex flex-col justify-center order-1 lg:order-1">
              <div className={sectionTitleClasses + " mb-6 lg:mb-8 text-2xl sm:text-3xl md:text-4xl text-center lg:text-left"}>
                Bring Ambe to Your Company
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-center lg:text-left" style={{ color: '#535353' }}>
                We offer high-impact, cost-effective wellness programs designed 
                to deliver real results for organizations.
              </p>
            </div>

            {/* Right Benefits */}
            <div className="w-full lg:flex-1 space-y-6 sm:space-y-8 order-2 lg:order-2">
              {/* Benefit 1 */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  <Image
                    src="/images/enterprise/bring-ambe-1.png"
                    alt="Customized solutions"
                    width={64}
                    height={64}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
                  />
                </div>
                <p className="text-sm sm:text-base leading-relaxed pt-2 sm:pt-3" style={{ color: '#535353' }}>
                  Fully customized solutions tailored to your workforce
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  <Image
                    src="/images/enterprise/bring-ambe-2.png"
                    alt="High-return services"
                    width={64}
                    height={64}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
                  />
                </div>
                <p className="text-sm sm:text-base leading-relaxed pt-2 sm:pt-3" style={{ color: '#535353' }}>
                  Lean, high-return services that maximize value
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full flex items-center justify-center flex-shrink-0 bg-white">
                  <Image
                    src="/images/enterprise/bring-ambe-3.png"
                    alt="Team support"
                    width={64}
                    height={64}
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-contain"
                  />
                </div>
                <p className="text-sm sm:text-base leading-relaxed pt-2 sm:pt-3" style={{ color: '#535353' }}>
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
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black/40 z-[1]"></div>
        <div className="relative z-10">
          {/* Let's Design a New Standard Section */}
          <div className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-10 md:pb-12">
            <div className="max-w-5xl mx-auto px-6 sm:px-8">
              <div 
                className="py-8 sm:py-12 md:py-16 px-6 sm:px-8 md:px-12 text-center"
                style={{ 
                  backgroundColor: 'rgba(244, 244, 244, 0.7)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}
              >
                <div className={sectionTitleClasses + " mb-6 sm:mb-8 text-2xl sm:text-3xl md:text-4xl"}>
                  Let&apos;s Design a New Standard
                </div>
                <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto" style={{ color: '#535353' }}>
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
          <div className="pb-12 sm:pb-16 md:pb-20">
            <div className="max-w-5xl mx-auto px-6 sm:px-8">
              <div 
                className="py-8 sm:py-12 md:py-16 px-6 sm:px-8 md:px-12" 
                style={{ 
                  backgroundColor: 'rgba(244, 244, 244, 0.7)',
                  borderTopLeftRadius: '120px',
                  borderTopRightRadius: '0px',
                  borderBottomRightRadius: '120px',
                  borderBottomLeftRadius: '0px'
                }}>
                <div className={sectionTitleClasses + " text-center mb-4 text-2xl sm:text-3xl md:text-4xl"}>
                  Contact
                </div>
                <p className="text-center mb-8 sm:mb-10 md:mb-12 text-sm sm:text-base" style={{ color: '#535353' }}>
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