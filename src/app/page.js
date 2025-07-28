"use client";
import React from 'react';
import Link from 'next/link';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
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
                  For the first time in 20 years of nonstop output, I found a wellness system that didn't just slow me down—it woke me up. Ambé's personalized protocols gave me energy I didn't know I was missing, and helped me show up sharper, calmer, and more focused than ever before.
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
                  Between shift work and stress, I was running on empty. Ambé didn't hand me a generic plan—they listened. My sleep, digestion, and moods have all leveled out. I finally feel in control of my health, and my team noticed the difference too.
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
                  I never thought wellness was made for someone like me. Ambé changed that. They spoke my language, respected my time, and helped my body stop hurting every day. It's not just medicine—it's care that fits real life.
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
            Dr. Google is scary. We get it. You've tried the threads—the threads on the threads... It's time for something real, built around you. Clarity is a form of care.
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
                At Ambé, every formula is tailored to your unique mind-body type. No algorithms. No shortcuts. Just real doctors creating real, time-tested protocols—just for you. We don't do "standard." Ambé formulas are hand-built by doctors to reflect your specific constitution, habits, and environment. You deserve precision—not guesswork.
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

      {/* For Businesses Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-light text-center mb-4">For Businesses</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Transform your workplace with comprehensive wellness solutions that drive results.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-5xl font-light text-orange-500 mb-2">87%</div>
              <p className="text-gray-600">Employee satisfaction increase</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light text-orange-500 mb-2">3.2x</div>
              <p className="text-gray-600">ROI on wellness investment</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-light text-orange-500 mb-2">45%</div>
              <p className="text-gray-600">Reduction in sick days</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-12 rounded-2xl">
            <h3 className="text-2xl font-semibold mb-8 text-center">Enterprise Benefits</h3>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Dedicated Account Management</h4>
                  <p className="text-gray-600 text-sm">Personal support for seamless implementation and ongoing success</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Custom Wellness Programs</h4>
                  <p className="text-gray-600 text-sm">Tailored solutions based on your company&apos;s unique needs</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Analytics Dashboard</h4>
                  <p className="text-gray-600 text-sm">Track engagement, outcomes, and ROI in real-time</p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Flexible Pricing</h4>
                  <p className="text-gray-600 text-sm">Scalable plans that grow with your organization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-light text-center mb-12">
            How we compare
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-4 px-4 font-medium"></th>
                  <th className="text-center py-4 px-4">
                    <div className="font-semibold">AMBE</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-normal text-gray-600">Insurance-based care</div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="font-normal text-gray-600">Concierge medicine</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Holistic care approach</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">24/7 access to care team</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Transparent pricing</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Preventive focus</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">Affordable for everyone</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-4 px-4">No insurance required</td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <XMarkIcon className="w-5 h-5 text-gray-400 mx-auto" />
                  </td>
                  <td className="text-center py-4 px-4">
                    <CheckIcon className="w-5 h-5 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-light text-white mb-6">
            Take control of your health today
          </h2>
          <p className="text-xl text-white mb-8">
            Join thousands of users who are living healthier, happier lives.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-green-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition duration-300">
              Start your journey
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white hover:text-green-600 transition duration-300">
              Book a consultation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-3xl font-bold mb-4">AMBE®</h3>
              <p className="text-gray-400 mb-6">
                Revolutionizing healthcare with a holistic approach to wellness.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Enterprise</a></li>
                <li><a href="#" className="hover:text-white">Download App</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Press</a></li>
                <li><a href="#" className="hover:text-white">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <p>&copy; 2024 AMBE Health Inc. All rights reserved.</p>
            <p>Made with ❤️ for your wellness journey</p>
          </div>
        </div>
      </footer>

    </div>
  );
}

