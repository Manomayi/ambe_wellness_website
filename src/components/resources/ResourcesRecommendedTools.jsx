"use client";

import React from "react";
import Image from "next/image";

const TOOLS = [
  {
    id: "think-dirty",
    name: "Think Dirty®",
    badge: "Clean Beauty & Ingredient Scanner",
    description:
      "An independent app empowering you to discover toxic ingredients in personal care, cosmetics, and household products. Scan barcodes to view an instant 0-10 Dirty Meter® rating and find clean, non-toxic alternatives.",
    icon: "/images/resources/think_dirty.png",
    url: "https://www.thinkdirtyapp.com",
    cta: "Visit Think Dirty",
    externalText: "thinkdirtyapp.com",
  },
  {
    id: "inci-beauty",
    name: "INCI Beauty",
    badge: "Cosmetic Composition Scanner",
    description:
      "Decipher cosmetic ingredient lists in seconds. By analyzing the INCI breakdown with thousands of chemical formulas, INCI Beauty helps you assess potential health hazards, allergens, and clean formulations.",
    icon: "/images/resources/inci_beauty.png",
    url: "https://apps.apple.com/us/app/inci-beauty-cosmetic-scanner/id1276113963",
    cta: "Get on App Store",
    externalText: "Apple App Store",
  },
  {
    id: "yuka",
    name: "Yuka",
    badge: "Food & Personal Care",
    description:
      "Scans barcodes of personal care and food items to evaluate their health impact. Completely independent with clear color-coded evaluations and healthier recommendations.",
    icon: "/images/resources/yuka.png",
    url: "https://yuka.io/en/",
    cta: "Explore Yuka",
    externalText: "yuka.io",
  },
  {
    id: "ewg",
    name: "EWG Healthy Living",
    badge: "Non-Toxic Safety Database",
    description:
      "Backed by the Environmental Working Group’s Skin Deep® database, offering ratings on tens of thousands of cosmetics, sunscreens, cleaning products, and packaged foods.",
    icon: "/images/resources/ewg.png",
    url: "https://www.ewg.org/apps/",
    cta: "Explore EWG",
    externalText: "ewg.org",
  },
];

export default function ResourcesRecommendedTools() {
  return (
    <section className="bg-white py-16 sm:py-20 border-y border-[#E8E3DA]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <p className="text-xs tracking-[0.25em] uppercase text-ambe-gold font-medium mb-3">
            Recommended Clean Living Tools
          </p>
          <h2 className="font-heading !text-3xl sm:!text-4xl md:!text-[2.65rem] !text-charcoal !font-normal !leading-tight mb-4">
            Scan &amp; verify your everyday essentials.
          </h2>
          <p className="text-sm sm:text-base text-[#6B6862] leading-relaxed">
            Clean living starts with knowing what touches your body and fills your
            home. We recommend these trusted ingredient scanners to help you evaluate
            personal care products, cosmetics, and household items on the go.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col sm:flex-row gap-5 p-6 sm:p-7 rounded-2xl bg-[#FAF8F5] border border-[#E7E2D9] hover:border-ambe-gold/50 transition-all hover:shadow-md group"
            >
              {/* App Icon */}
              <div className="shrink-0 flex items-start sm:items-center">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-sm border border-[#E7E2D9] relative bg-white flex items-center justify-center p-1">
                  <Image
                    src={tool.icon}
                    alt={tool.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-heading !text-xl sm:!text-2xl !text-[#1A1A1A] !font-normal">
                      {tool.name}
                    </h3>
                    <span className="text-[10px] tracking-wider uppercase font-semibold px-2.5 py-0.5 rounded-full bg-white text-[#8C7A6B] border border-[#E7E2D9]">
                      {tool.badge}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#6B6862] leading-relaxed mb-4">
                    {tool.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E7E2D9]/70 flex items-center justify-between">
                  <span className="text-[11px] text-[#9A948B]">{tool.externalText}</span>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs tracking-[0.12em] uppercase font-semibold text-[#1A1A1A] group-hover:text-ambe-gold transition-colors inline-flex items-center gap-1"
                  >
                    <span>{tool.cta}</span>
                    <span className="text-sm">↗</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
