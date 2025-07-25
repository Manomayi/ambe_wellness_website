"use client";
import React from 'react';
import Link from 'next/link';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function Home() {

  return (
    <div className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="text-2xl font-bold text-white">AMBE®</div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-white hover:text-gray-200 text-sm">Enterprise</a>
              <a href="#" className="text-white hover:text-gray-200 text-sm">Usership</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-100">
              Download App
            </button>
            <Link href="/login" className="text-white hover:text-gray-200 text-sm">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero_background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-light mb-8 leading-tight text-white">
              Holistic-Doctor led care<br />pay as you like
            </h1>
            
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-medium transition duration-300">
              Become a member
            </button>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <p className="text-gray-500 text-sm mb-12">Trusted by American Apparel</p>
          <p className="text-3xl text-gray-800 max-w-4xl mx-auto font-light leading-relaxed">
            &ldquo;From the moment I joined AMBE and had my consultation with Dr. Schoepfer, I knew I was in good hands. He took time to ask me questions about my health concerns, really listened to me and created a comprehensive plan for me. I highly recommend this to anyone looking to improve their health and wellness.&rdquo;
          </p>
        </div>
      </section>

      {/* For People Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-4xl font-light text-center mb-4">For People</h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            We&apos;re building a new health system, one that puts you in control. Get healthy, happy and wise.
          </p>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-3">Personalized care team</h3>
                <p className="text-gray-600">
                  Your care team includes doctors, health coaches, nutritionists, fitness trainers and more.
                </p>
              </div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-light mb-3">Clinically backed programs</h3>
                <p className="text-gray-600">
                  Evidence-based programs designed by medical professionals for lasting results.
                </p>
              </div>
              
              <div>
                <h3 className="text-2xl font-light mb-3">24/7 access</h3>
                <p className="text-gray-600">
                  Connect with your care team anytime through chat, video calls, or in-person visits.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-lg">
              <h4 className="text-xl font-semibold mb-6">What&apos;s included:</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Unlimited doctor consultations</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Personalized health plans</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Mental health support</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Nutrition guidance</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Fitness programs</span>
                </li>
              </ul>
            </div>
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
        <div className="max-w-5xl mx-auto px-8">
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
        <div className="max-w-4xl mx-auto px-8 text-center">
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

