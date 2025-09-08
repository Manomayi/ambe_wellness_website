"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckIcon } from "@heroicons/react/24/solid";
import Button from "@/components/common/Button";
import VideoBackground from "@/components/common/VideoBackground";
import Navigation from "@/components/navigation/Navigation";
import {
  sectionTitleClasses,
  bannerTitleClasses,
} from "@/lib/styles/constants";
import Footer from "@/components/common/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
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
          <div className="min-h-[75vh] flex items-center py-20">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-16">
                <div className="max-w-3xl">
                  <div
                    className={bannerTitleClasses + " mb-2 leading-tight"}
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
                    className="text-white text-sm sm:text-base font-bold"
                    style={{ color: "white" }}
                  >
                    Pay As You Want
                  </p>
                  <p
                    className="text-white mb-6 sm:mb-8 text-sm sm:text-base font-bold"
                    style={{ color: "white" }}
                  >
                    Developed at Stanford
                  </p>

                  <Button>BOOK NOW</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Trusted By Section - Now part of banner */}
          <div className="pb-12 sm:pb-16 md:pb-20">
            <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
              {/* Icons Section */}
              <div className="mb-12 sm:mb-16 px-4">
                <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto">
                  {/* Skin & Hair */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/healthcare.png"
                        alt="Skin & Hair"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Skin &<br/>Hair</p>
                  </div>
                  
                  {/* Women's Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/healthcare (1).png"
                        alt="Women's Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Women's<br/>Health</p>
                  </div>
                  
                  {/* Men's Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/patient.png"
                        alt="Men's Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Men's<br/>Health</p>
                  </div>
                  
                  {/* Digestive Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/healthy-food.png"
                        alt="Digestive Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Digestive<br/>Health</p>
                  </div>
                  
                  {/* Musculoskeletal */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/broken-bone.png"
                        alt="Musculoskeletal"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Musculo-<br/>skeletal</p>
                  </div>
                  
                  {/* Mental Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/talk.png"
                        alt="Mental Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Mental<br/>Health</p>
                  </div>
                  
                  {/* Longevity */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/award.png"
                        alt="Longevity"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Longevity</p>
                  </div>
                  
                  {/* Weight Management */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/plan.png"
                        alt="Weight Management"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Weight<br/>Mgmt</p>
                  </div>
                  
                  {/* Hormone Health */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/supplements.png"
                        alt="Hormone Health"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Hormone<br/>Health</p>
                  </div>
                  
                  {/* Wellness Guides */}
                  <div className="bg-white rounded-full p-2 flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-1 relative">
                      <Image
                        src="/images/icons/herbal.png"
                        alt="Wellness Guides"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-[5px] sm:text-[6px] text-center text-gray-800 leading-[0.9]">Wellness<br/>Guides</p>
                  </div>
                </div>
              </div>

              <div className="mb-8 sm:mb-12 text-center px-4">
                <div
                  className={
                    sectionTitleClasses +
                    " mb-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                  }
                  style={{ color: "white" }}
                >
                  Trusted by:
                </div>
                <div
                  className="font-bold mb-4 text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                  style={{ color: "white" }}
                >
                  American Apparel™
                </div>
                <p
                  className="text-sm sm:text-base lg:text-lg"
                  style={{ color: "white" }}
                >
                  Pioneers In Corporate Wellness: A Better Way To Grow
                </p>
              </div>

              {/* Testimonials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
                {/* David Testimonial */}
                <div className="relative flex justify-center px-4 md:px-0">
                  <div
                    className="rounded-full p-4 sm:p-4 md:p-6 lg:p-6 xl:p-5 flex flex-col items-center w-[calc(100vw-32px)] md:w-[400px] lg:w-[400px] xl:w-[400px] max-w-[380px] md:max-w-none h-[calc(100vw-32px)] md:h-[400px] lg:h-[400px] xl:h-[400px] max-h-[380px] md:max-h-none"
                    style={{ backgroundColor: "#FFD3AC" }}
                  >
                    <div className="relative w-16 sm:w-16 md:w-20 lg:w-18 xl:w-16 h-16 sm:h-16 md:h-20 lg:h-18 xl:h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden">
                      <Image
                        src="/images/testimonials/david.png"
                        alt="David"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div
                      className="text-sm sm:text-base md:text-lg font-semibold text-center mb-3 min-h-[2.5rem] sm:min-h-[3rem] flex items-center"
                      style={{ color: "#353535" }}
                    >
                      Chief Strategy Officer,
                      <br />
                      National Tech Firm
                    </div>
                    <p
                      className="text-xs sm:text-sm text-center leading-relaxed flex-1 flex items-start px-2"
                      style={{ color: "#353535" }}
                    >
                      For the first time in 20 years of nonstop output, I found a
                      wellness system that didn&apos;t just slow me down—it woke me
                      up. Ambé&apos;s personalized protocols gave me energy I
                      didn&apos;t know I was missing, and helped me show up sharper,
                      calmer, and more focused than ever before.
                    </p>
                    <p
                      className="text-center font-semibold mt-3 sm:mt-4 text-sm sm:text-base"
                      style={{ color: "#353535" }}
                    >
                      David
                    </p>
                  </div>
                </div>

                {/* Joshua Testimonial */}
                <div className="relative flex justify-center px-4 md:px-0">
                  <div
                    className="rounded-full p-4 sm:p-4 md:p-6 lg:p-6 xl:p-5 flex flex-col items-center w-[calc(100vw-32px)] md:w-[400px] lg:w-[400px] xl:w-[400px] max-w-[380px] md:max-w-none h-[calc(100vw-32px)] md:h-[400px] lg:h-[400px] xl:h-[400px] max-h-[380px] md:max-h-none"
                    style={{ backgroundColor: "#FFD3AC" }}
                  >
                    <div className="relative w-16 sm:w-16 md:w-20 lg:w-18 xl:w-16 h-16 sm:h-16 md:h-20 lg:h-18 xl:h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden">
                      <Image
                        src="/images/testimonials/joshua.png"
                        alt="Joshua"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div
                      className="text-sm sm:text-base md:text-lg font-semibold text-center mb-3 min-h-[2.5rem] sm:min-h-[3rem] flex items-center"
                      style={{ color: "#353535" }}
                    >
                      Operations Supervisor,
                      <br />
                      Regional Distribution Center
                    </div>
                    <p
                      className="text-xs sm:text-sm text-center leading-relaxed flex-1 flex items-start px-2"
                      style={{ color: "#353535" }}
                    >
                      Between shift work and stress, I was running on empty. Ambé
                      didn&apos;t hand me a generic plan—they listened. My sleep,
                      digestion, and moods have all leveled out. I finally feel in
                      control of my health, and my team noticed the difference too.
                    </p>
                    <p
                      className="text-center font-semibold mt-3 sm:mt-4 text-sm sm:text-base"
                      style={{ color: "#353535" }}
                    >
                      Joshua
                    </p>
                  </div>
                </div>

                {/* Rosario Testimonial */}
                <div className="relative flex justify-center px-4 md:px-0 md:col-span-2 xl:col-span-1">
                  <div
                    className="rounded-full p-4 sm:p-4 md:p-6 lg:p-6 xl:p-5 flex flex-col items-center w-[calc(100vw-32px)] md:w-[400px] lg:w-[400px] xl:w-[400px] max-w-[380px] md:max-w-none h-[calc(100vw-32px)] md:h-[400px] lg:h-[400px] xl:h-[400px] max-h-[380px] md:max-h-none"
                    style={{ backgroundColor: "#FFD3AC" }}
                  >
                    <div className="relative w-16 sm:w-16 md:w-20 lg:w-18 xl:w-16 h-16 sm:h-16 md:h-20 lg:h-18 xl:h-16 rounded-full mb-3 flex-shrink-0 overflow-hidden">
                      <Image
                        src="/images/testimonials/rosario.png"
                        alt="Rosario"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div
                      className="text-sm sm:text-base md:text-lg font-semibold text-center mb-3 min-h-[2.5rem] sm:min-h-[3rem] flex items-center"
                      style={{ color: "#353535" }}
                    >
                      Warehouse Associate,
                      <br />
                      National Retail Chain
                    </div>
                    <p
                      className="text-xs sm:text-sm text-center leading-relaxed flex-1 flex items-start px-2"
                      style={{ color: "#353535" }}
                    >
                      I never thought wellness was made for someone like me. Ambé
                      changed that. They spoke my language, respected my time, and
                      helped my body stop hurting every day. It&apos;s not just
                      medicine—it&apos;s care that fits real life.
                    </p>
                    <p
                      className="text-center font-semibold mt-3 sm:mt-4 text-sm sm:text-base"
                      style={{ color: "#353535" }}
                    >
                      Rosario
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio-Markers Stats */}
              <div className="text-center px-4">
                <p
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl"
                  style={{ color: "white" }}
                >
                  <span className="font-bold underline">55</span>{" "}
                  <span className="font-light">Million Bio-Markers analysed</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ayurveda Meets Epigenetics Section */}
      <section style={{ backgroundColor: "#F4F4F4" }}>
        <Image
          src="/images/tired.png"
          alt="Ayurveda Meets Epigenetics"
          width={1400}
          height={800}
          className="w-full h-auto"
        />
      </section>

      {/* Time Tested Section - Commented Out */}
      {/* <section
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: "#F4F4F4" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              sectionTitleClasses +
              " text-center mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl"
            }
          >
            Time Tested and Results Driven
          </div>
          <p
            className="text-center text-base sm:text-lg mb-8 sm:mb-12 md:mb-16 max-w-5xl mx-auto px-4"
            style={{ color: "#535353" }}
          >
            Dr. Google is scary. We get it. You&apos;ve tried the threads—the
            threads on the threads... It&apos;s time for something real, built
            around you. Clarity is a form of care.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 sm:mb-12 md:mb-16">
            <div className="text-center bg-white p-6">
              <div className="mb-6 h-20 sm:h-24 flex items-center justify-center">
                <div className="relative w-14 sm:w-16 h-14 sm:h-16">
                  <Image
                    src="/images/time-tested/conflicted.png"
                    alt="Conflicted"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div
                className="text-lg sm:text-xl font-semibold mb-4"
                style={{ color: "#353535" }}
              >
                Conflicted by fad-driven advice and
                <br className="hidden sm:block" />
                <span className="sm:hidden">
                  Conflicted by fad-driven advice and{" "}
                </span>
                endless tests without real insight?
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#535353" }}
              >
                Ambé cuts through the noise with time-tested, evidence-based
                care and real credentials—thousands of years of wisdom versus a
                few years of fragmented information in holistic medicine.
              </p>
            </div>

            <div className="text-center bg-white p-6">
              <div className="mb-6 h-20 sm:h-24 flex items-center justify-center">
                <div className="relative w-14 sm:w-16 h-14 sm:h-16">
                  <Image
                    src="/images/time-tested/tired.png"
                    alt="Tired"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div
                className="text-lg sm:text-xl font-semibold mb-4"
                style={{ color: "#353535" }}
              >
                Tired of one-size-fits-all
                <br className="hidden sm:block" />
                <span className="sm:hidden">Tired of one-size-fits-all </span>
                supplements?
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#535353" }}
              >
                At Ambé, every formula is tailored to your unique mind-body
                type. No algorithms. No shortcuts. Just real doctors creating
                real, time-tested protocols—just for you. We don&apos;t do
                &quot;standard.&quot; Ambé formulas are hand-built by doctors to
                reflect your specific constitution, habits, and environment. You
                deserve precision—not guesswork.
              </p>
            </div>

            <div className="text-center bg-white p-6">
              <div className="mb-6 h-20 sm:h-24 flex items-center justify-center">
                <div className="relative w-14 sm:w-16 h-14 sm:h-16">
                  <Image
                    src="/images/time-tested/overcharged.png"
                    alt="Overcharged"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div
                className="text-lg sm:text-xl font-semibold mb-4"
                style={{ color: "#353535" }}
              >
                Being overcharged by underqualified,
                <br className="hidden sm:block" />
                <span className="sm:hidden">
                  Being overcharged by underqualified,{" "}
                </span>
                self-professed experts?
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#535353" }}
              >
                The human psychology of valuing only that which we pay a lot for
                can be remedied with proven results. By setting an example—by
                making high-quality health care available to everyone. We hope,
                that most will benefit.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button className="mb-4">BOOK NOW</Button>
            <p className="text-sm" style={{ color: "#535353" }}>
              Two minutes. No commitment. Much clarity.
            </p>
          </div>
        </div>
      </section> */}

      {/* How We Compare Section - Moved Here */}
      <section
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: "#F4F4F4" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              sectionTitleClasses + " mb-4 text-2xl sm:text-3xl md:text-4xl"
            }
          >
            How We Compare
          </div>
          <p className="text-base sm:text-lg mb-8 sm:mb-12 md:mb-16 text-body">
            No hidden fees, ever.
          </p>

          {/* Comparison Table */}
          <div className="overflow-x-auto -mx-6 sm:-mx-8 px-6 sm:px-8">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left py-2 sm:py-4 pr-4 sm:pr-8 font-normal"></th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-4">
                    <Image
                      src="/images/ambe_logo.png"
                      alt="Ambe Logo"
                      width={100}
                      height={33}
                      className="mx-auto"
                    />
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-center font-normal text-charcoal text-xs sm:text-sm md:text-base">
                    OUR
                    <br />
                    COMPETITORS
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-center font-normal text-charcoal text-xs sm:text-sm md:text-base">
                    OTHERS
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-center font-normal text-charcoal text-xs sm:text-sm md:text-base">
                    NUTRITIONIST
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-center font-normal text-charcoal text-xs sm:text-sm md:text-base">
                    BIOMARKER
                    <br />
                    RESULTS
                  </th>
                  <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-4 text-center font-normal text-charcoal text-xs sm:text-sm md:text-base">
                    GENE RESULTS
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Integrative Doctors */}
                <tr className="border-t border-gray-200">
                  <td className="py-3 sm:py-4 md:py-6 pr-4 sm:pr-8 text-sm sm:text-base md:text-lg text-charcoal">
                    Integrative Doctors
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 sm:w-24 md:w-32 h-10 sm:h-12 md:h-16 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-charcoal text-xs sm:text-sm md:text-base">
                    $ 500/Visit
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                </tr>

                {/* 1 on 1 Video */}
                <tr className="border-t border-gray-200">
                  <td className="py-3 sm:py-4 md:py-6 pr-4 sm:pr-8 text-sm sm:text-base md:text-lg text-charcoal">
                    1 on 1 Video
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 sm:w-24 md:w-32 h-10 sm:h-12 md:h-16 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-charcoal text-xs sm:text-sm md:text-base">
                    $ 500/Visit
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 sm:w-24 md:w-32 h-10 sm:h-12 md:h-16 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                </tr>

                {/* Unlimited Texting */}
                <tr className="border-t border-gray-200">
                  <td className="py-3 sm:py-4 md:py-6 pr-4 sm:pr-8 text-sm sm:text-base md:text-lg text-charcoal">
                    Unlimited Texting
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 sm:w-24 md:w-32 h-10 sm:h-12 md:h-16 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                </tr>

                {/* Time Tested */}
                <tr className="border-t border-gray-200">
                  <td className="py-3 sm:py-4 md:py-6 pr-4 sm:pr-8 text-sm sm:text-base md:text-lg text-charcoal">
                    Time Tested
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 sm:w-24 md:w-32 h-10 sm:h-12 md:h-16 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-charcoal text-xs sm:text-sm md:text-base">
                    Infrequently
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                </tr>

                {/* Bio markers tested */}
                <tr className="border-t border-gray-200">
                  <td className="py-3 sm:py-4 md:py-6 pr-4 sm:pr-8 text-sm sm:text-base md:text-lg text-charcoal">
                    Bio markers tested
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <span className="text-xs sm:text-sm text-charcoal">
                        100 tests = $100
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-xs sm:text-sm text-charcoal">
                    100 tests =<br />
                    min $300
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-charcoal text-xs sm:text-sm md:text-base">
                    $250
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 sm:w-24 md:w-32 h-10 sm:h-12 md:h-16 rounded-xl sm:rounded-2xl bg-[#FFD3AC]">
                      <CheckIcon className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 text-charcoal" />
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 text-center text-base sm:text-lg md:text-xl text-charcoal">
                    X
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: "#E5E5E5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Image
            src="/images/Frame 72.png"
            alt="Ayurveda Meets Epigenetics"
            width={1200}
            height={400}
            className="w-full h-auto object-contain"
          />
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
        style={{ backgroundColor: "#F4F4F4" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 lg:gap-x-16 xl:gap-x-32 gap-y-8 sm:gap-y-12 md:gap-y-16">
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
        </div>
      </section>

      {/* Meet the Experts Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={
              sectionTitleClasses +
              " text-center mb-4 text-2xl sm:text-3xl md:text-4xl"
            }
          >
            Meet the Experts
          </div>
          <p className="text-center text-base sm:text-lg mb-8 sm:mb-12 md:mb-16 max-w-5xl mx-auto text-body px-4">
            Licensed. Global. Guided by science. Every Ambé practitioner is
            trained in traditional medicine and modern clinical
            frameworks–bringing deep expertise to every personalized plan.
          </p>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dr. Smita Bhatia */}
            <div className="bg-white p-6 sm:p-8 text-center">
              <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full mx-auto mb-4 overflow-hidden">
                <Image
                  src="/images/doctors/smita_bhatia.png"
                  alt="Dr. Smita Bhatia"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-1 text-charcoal">
                Dr. Smita Bhatia
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">Doctor of Ayurvedic</p>
              <p className="text-sm mb-1 text-body">Medicine and Surgery</p>
              <p className="text-sm font-medium text-charcoal">
                Oncology Director
              </p>
            </div>

            {/* Dr. Jeremy Stone */}
            <div className="bg-white p-6 sm:p-8 text-center">
              <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full mx-auto mb-4 overflow-hidden">
                <Image
                  src="/images/doctors/jeremy_stone.png"
                  alt="Dr. Jeremy Stone"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-1 text-charcoal">
                Dr. Jeremy Stone
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">Doctor of Ayurvedic</p>
              <p className="text-sm mb-1 text-body">Medicine and Surgery</p>
              <p className="text-sm font-medium text-charcoal">Metabolic and</p>
              <p className="text-sm font-medium text-charcoal">
                musculoskeletal specialist
              </p>
            </div>

            {/* Dr. Anandibai Joshi */}
            <div className="bg-white p-6 sm:p-8 text-center">
              <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full mx-auto mb-4 overflow-hidden">
                <Image
                  src="/images/doctors/anandibai_joshi.png"
                  alt="Dr. Anandibai Joshi"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-1 text-charcoal">
                Dr. Anandibai Joshi
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">Doctor of Ayurvedic</p>
              <p className="text-sm mb-1 text-body">Medicine and Surgery</p>
              <p className="text-sm font-medium text-charcoal">
                Psychology specialist
              </p>
            </div>

            {/* Dr. Indira Hinduja */}
            <div className="bg-white p-6 sm:p-8 text-center">
              <div className="relative w-32 sm:w-40 md:w-48 h-32 sm:h-40 md:h-48 rounded-full mx-auto mb-4 overflow-hidden">
                <Image
                  src="/images/doctors/indira_hinduja.png"
                  alt="Dr. Indira Hinduja"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-lg sm:text-xl font-semibold mb-1 text-charcoal">
                Dr. Indira Hinduja
              </div>
              <p className="text-sm mb-1 text-body">MBBS</p>
              <p className="text-sm mb-2 text-body">BAMS</p>
              <p className="text-sm mb-1 text-body">Doctor of Ayurvedic</p>
              <p className="text-sm mb-1 text-body">Medicine and Surgery</p>
              <p className="text-sm font-medium text-charcoal">
                OBGYN and women&apos;s health
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Education Section */}
      <section
        className="py-12 sm:py-16 md:py-20"
        style={{ backgroundColor: "#E5E5E5" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="w-full mb-8 sm:mb-12">
            {/* Mobile: Vertical stack */}
            <div className="md:hidden flex flex-col gap-2">
              <button
                className="w-full px-4 py-2 rounded-full text-xs text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                Do You Need Labs for HRT?
              </button>
              <button
                className="w-full px-4 py-2.5 rounded-full text-xs text-center"
                style={{ backgroundColor: "#FFD3AC", color: "#353535" }}
              >
                Bio markers and holistic integration
              </button>
              <button
                className="w-full px-4 py-2 rounded-full text-xs text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                How We Personalize Every Formula
              </button>
              <button
                className="w-full px-4 py-2 rounded-full text-xs text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                Prevent contraindicated therapies with Pharmaceuticals
              </button>
              <button
                className="w-full px-4 py-2 rounded-full text-xs text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                Mislabeled Therapies to Watch Out For
              </button>
            </div>

            {/* Desktop: Single row with equal width */}
            <div className="hidden md:flex justify-between gap-3 lg:gap-4">
              <button
                className="flex-1 px-2 lg:px-4 py-2 rounded-full text-sm text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                <span className="block whitespace-normal">
                  Do You Need
                  <br className="lg:hidden" />
                  Labs for HRT?
                </span>
              </button>
              <button
                className="flex-1 px-2 lg:px-4 py-2.5 lg:py-3 rounded-full text-sm text-center"
                style={{ backgroundColor: "#FFD3AC", color: "#353535" }}
              >
                <span className="block whitespace-normal">
                  Bio markers and
                  <br className="lg:hidden" />
                  holistic integration
                </span>
              </button>
              <button
                className="flex-1 px-2 lg:px-4 py-2 rounded-full text-sm text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                <span className="block whitespace-normal">
                  How We Personalize
                  <br className="lg:hidden" />
                  Every Formula
                </span>
              </button>
              <button
                className="flex-1 px-2 lg:px-4 py-2 rounded-full text-sm text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                <span className="block whitespace-normal">
                  Prevent contraindicated
                  <br className="lg:hidden" />
                  therapies with
                  <br className="lg:hidden" />
                  Pharmaceuticals
                </span>
              </button>
              <button
                className="flex-1 px-2 lg:px-4 py-2 rounded-full text-sm text-center"
                style={{ backgroundColor: "#FFFFFF", color: "#353535" }}
              >
                <span className="block whitespace-normal">
                  Mislabeled Therapies
                  <br className="lg:hidden" />
                  to Watch Out For
                </span>
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            {/* Left Image */}
            <div className="w-full lg:flex-1">
              <div
                className="relative overflow-hidden h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] w-full mx-auto max-w-md lg:max-w-none"
                style={{ borderRadius: "0 150px 0 150px" }}
              >
                <Image
                  src="/images/home/hands.png"
                  alt="Hands holding light"
                  width={600}
                  height={400}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="w-full lg:flex-1">
              <div
                className="text-2xl sm:text-3xl font-semibold mb-4 sm:mb-6"
                style={{ color: "#353535" }}
              >
                Bio markers and holistic integration
              </div>
              <p
                className="text-sm sm:text-base leading-relaxed"
                style={{ color: "#535353" }}
              >
                Bio markers are often not time tested nor really accurate when
                it comes to hormones because hormones fluctuate day to day if
                not hour to hour. We often don&apos;t catch imbalances or
                deficiencies until its far advanced and harder to treat. We
                employ lab bio markers along with time tested methods, often
                catching imbalance early on.
              </p>
            </div>
          </div>
        </div>
      </section>

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
                  className="absolute left-1/2 transform -translate-x-1/2 -top-8 sm:-top-10 w-16 sm:w-20 h-16 sm:h-20 rounded-full flex items-center justify-center z-10"
                  style={{ backgroundColor: "#E5E5E5" }}
                >
                  <span
                    className="text-3xl sm:text-4xl"
                    style={{ color: "#FFD3AC" }}
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
                      className="text-sm sm:text-base md:text-lg mb-3 sm:mb-4"
                      style={{ color: "#353535" }}
                    >
                      We&apos;re doctors, entrepreneurs and researchers with
                      decades of experience.
                    </p>
                    <p
                      className="text-sm sm:text-base md:text-lg mb-8 sm:mb-12"
                      style={{ color: "#353535" }}
                    >
                      Ambé is built for the soul of the modern man.
                    </p>

                    {/* Main Quote */}
                    <div
                      className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light leading-tight mb-8 sm:mb-12"
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
                      className="text-right text-sm sm:text-base md:text-lg"
                      style={{ color: "#353535" }}
                    >
                      -Founder
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental Message Container */}
            <div className="max-w-5xl mx-auto px-6 sm:px-8 mt-8 sm:mt-12 md:mt-16">
              <div
                className="rounded-2xl sm:rounded-3xl py-8 sm:py-10 md:py-12 px-6 sm:px-8 md:px-12"
                style={{ backgroundColor: "rgba(244, 244, 244, 0.7)" }}
              >
                <p
                  className="text-sm sm:text-base leading-relaxed text-center"
                  style={{ color: "#353535" }}
                >
                  Ten trees planted per member, per month = 120 trees per year
                  per member. Our health depends
                  <br className="hidden md:block" />
                  <span className="md:hidden">
                    Ten trees planted per member, per month = 120 trees per year
                    per member. Our health depends{" "}
                  </span>
                  on the health of Mother Nature — trees are proven to be the #1
                  way to purify and nourish the
                  <br className="hidden md:block" />
                  <span className="md:hidden">
                    on the health of Mother Nature — trees are proven to be the
                    #1 way to purify and nourish the{" "}
                  </span>
                  environment and help avert.
                </p>
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
