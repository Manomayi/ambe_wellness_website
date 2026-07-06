"use client";
import React from "react";

const APP_STORE_URL = "https://apps.apple.com/us/app/ambewellness/id6523417737";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.ambe.wellness";

function AppStoreBadge() {
  return (
    <a
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Download on the App Store"
      className="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 transition-transform hover:scale-105"
    >
      <svg width="26" height="26" viewBox="0 0 384 512" fill="#FFFFFF" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span className="text-left leading-tight" style={{ color: "#FFFFFF" }}>
        <span className="block text-[11px] font-normal" style={{ color: "#FFFFFF" }}>Download on the</span>
        <span className="block text-lg font-semibold" style={{ color: "#FFFFFF" }}>App Store</span>
      </span>
    </a>
  );
}

function GooglePlayBadge() {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get it on Google Play"
      className="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 transition-transform hover:scale-105"
    >
      <svg width="24" height="26" viewBox="0 0 512 512" aria-hidden="true">
        <path fill="#00D7FE" d="M48 59.5C42 65.8 38.5 75.6 38.5 88.3v335.4c0 12.7 3.5 22.5 9.5 28.8l1.1 1.1L237 265.7v-19.4L48.1 58.4z" />
        <path fill="#FFBC00" d="M299.9 328.7L237 265.7v-19.4l63-63 1.4.8 74.5 42.3c21.3 12 21.3 31.8 0 43.9l-74.5 42.3z" />
        <path fill="#FF3946" d="M301.3 327.9L237 256 48 445c7 7.4 18.6 8.3 31.7.9z" />
        <path fill="#00F076" d="M48 67.1c-13.1-7.4-24.7-6.5-31.7.9L237 256l64.3-64.1z" transform="translate(0 -8.7)" />
      </svg>
      <span className="text-left leading-tight" style={{ color: "#FFFFFF" }}>
        <span className="block text-[11px] font-normal uppercase tracking-wide" style={{ color: "#FFFFFF" }}>Get it on</span>
        <span className="block text-lg font-semibold" style={{ color: "#FFFFFF" }}>Google Play</span>
      </span>
    </a>
  );
}

export default function AppDownload() {
  return (
    <section className="w-full" style={{ backgroundColor: "#F4F4F4" }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-12 sm:py-16">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Text */}
          <div className="max-w-xl">
            <div
              className="text-xs font-semibold tracking-widest uppercase mb-3"
              style={{ color: "#C8996A" }}
            >
              Get the App
            </div>
            <div
              className="font-heading text-2xl sm:text-3xl md:text-4xl font-medium mb-3"
              style={{ color: "#353535" }}
            >
              Your Wellness Journey in Your Pocket
            </div>
            <p className="text-sm sm:text-base" style={{ color: "#353535" }}>
              Consultations, your wellness plan, and messaging with your
              integrative doctor — all in the Ambé app.
            </p>
          </div>

          {/* Store badges */}
          <div className="flex flex-row flex-wrap gap-4 lg:flex-shrink-0">
            <AppStoreBadge />
            <GooglePlayBadge />
          </div>
        </div>
      </div>
    </section>
  );
}
