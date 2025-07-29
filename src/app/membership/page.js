"use client";
import React from 'react';
import Button from '@/components/common/Button';
import VideoBackground from '@/components/common/VideoBackground';
import Navigation from '@/components/navigation/Navigation';

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
              <div className="text-6xl font-light mb-4 leading-tight text-white" style={{ color: 'white', fontFamily: 'Playfair Display, serif' }}>
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
          <div className="text-5xl font-light text-center mb-16" style={{ color: '#353535', fontFamily: 'Playfair Display, serif' }}>
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

    </div>
  );
}