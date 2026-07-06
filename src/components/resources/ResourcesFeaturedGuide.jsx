"use client";

import Image from "next/image";

const GUIDE_TITLE = "The Ambé Healing Kitchen Guide";

export default function ResourcesFeaturedGuide({ onDownload }) {
  return (
    <section
      id="featured-guide"
      className="bg-ambe-cream py-12 sm:py-16 md:py-20 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          <div>
            <div className="relative aspect-[3/4] max-w-md mx-auto lg:mx-0 w-full bg-[#E8E3DA] overflow-hidden">
              <Image
                src="/images/home/hands.png"
                alt="Healing Kitchen Guide"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 420px"
                priority
              />
            </div>
            <span className="inline-block mt-4 bg-ambe-gold text-ambe-dark text-[10px] sm:text-xs tracking-[0.2em] uppercase font-semibold px-3 py-1.5">
              Featured Guide
            </span>
          </div>

          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-ambe-gold font-medium mb-4">
              New Release
            </p>

            <h2 className="font-heading !text-4xl sm:!text-[2.75rem] md:!text-5xl !text-charcoal !font-normal !leading-[1.12] mb-5 max-w-lg">
              {GUIDE_TITLE}
            </h2>

            <p className="text-sm sm:text-base text-charcoal/90 leading-relaxed mb-8">
              What you eat — and feed your pets — matters. Simple, practical
              guidance to transform your kitchen into a healing center, with
              Ayurvedic and doctor-approved tips for feeding those you love.
              Covers pantry essentials, spice protocols, seasonal eating, and
              anti-inflammatory meal frameworks.
            </p>

            <button
              type="button"
              onClick={() => onDownload?.(GUIDE_TITLE)}
              className="inline-flex items-center justify-center px-10 py-3.5 rounded-full text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase bg-ambe-peach text-charcoal hover:bg-charcoal hover:text-ambe-cream transition-colors cursor-pointer"
            >
              Download Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
