"use client";

import React from "react";
import Navigation from "@/components/navigation/Navigation";
import Footer from "@/components/common/Footer";
import EmailCaptureModal from "@/components/common/EmailCaptureModal";
import ResourcesGuideCard from "@/components/resources/ResourcesGuideCard";
import ResourcesFeaturedGuide from "@/components/resources/ResourcesFeaturedGuide";
import ResourcesCategoryOverview from "@/components/resources/ResourcesCategoryOverview";
import ResourcesStarterGuide from "@/components/resources/ResourcesStarterGuide";
import ResourcesCuratedReading from "@/components/resources/ResourcesCuratedReading";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_GUIDES,
  filterGuides,
} from "@/lib/resources/guides";

export default function Resources() {
  const [guide, setGuide] = React.useState(null);
  const [activeCategory, setActiveCategory] = React.useState("All");

  const openGuide = (title) => setGuide({ title: title || null });
  const filteredGuides = filterGuides(RESOURCE_GUIDES, activeCategory);

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    document.getElementById("resource-guides")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-ambe-cream">
      <EmailCaptureModal
        open={guide !== null}
        guideTitle={guide?.title}
        onClose={() => setGuide(null)}
      />

      <Navigation />

      {/* Hero */}
      <section
        className="relative pt-28 sm:pt-32 lg:pt-36 pb-16 sm:pb-20"
        style={{
          background:
            "linear-gradient(180deg, #1a1a1a 0%, #242424 55%, #1a1a1a 100%)",
        }}
      >
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
          <div className="max-w-3xl">
            <p className="text-xs sm:text-sm tracking-[0.25em] uppercase text-ambe-gold mb-5 font-medium">
              Free Resources
            </p>

            <h1 className="font-heading !text-4xl sm:!text-5xl lg:!text-[3.5rem] !text-ambe-cream leading-[1.1] mb-6">
              Ancient wisdom for{" "}
              <em className="italic !text-ambe-gold font-normal">modern living.</em>
            </h1>

            <p className="text-ambe-cream/90 text-base sm:text-lg md:text-xl font-light leading-relaxed mb-5 max-w-2xl">
              Real food. Clean essentials. Time-tested guidance — from kitchen to
              cabinet, everything you need to live well, free and yours to keep.
            </p>

            <p className="font-heading italic !text-ambe-gold text-lg sm:text-xl">
              Curated by integrative doctors. Rooted in tradition.
            </p>
          </div>
        </div>
      </section>

      {/* Category filter bar */}
      <section className="sticky top-0 z-40 bg-ambe-dark border-y border-[#353535]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {RESOURCE_CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm transition-colors ${
                    isActive
                      ? "bg-ambe-gold text-ambe-dark font-medium"
                      : "border border-ambe-cream/25 text-ambe-cream/80 hover:border-ambe-gold hover:text-ambe-gold"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <ResourcesFeaturedGuide onDownload={openGuide} />

      {/* Guide grid */}
      <section
        id="resource-guides"
        className="py-14 sm:py-16 md:py-20 bg-ambe-cream scroll-mt-24"
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <p className="text-xs tracking-[0.25em] uppercase text-ambe-gold text-center mb-4 font-medium">
            Digital Resources
          </p>
          <h2 className="font-heading !text-4xl sm:!text-[2.75rem] md:!text-5xl !text-charcoal !font-normal text-center mb-12 sm:mb-16 !leading-tight">
            Everything you need to live well.
          </h2>

          {filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredGuides.map((item) => (
                <ResourcesGuideCard
                  key={item.id}
                  guide={item}
                  onDownload={openGuide}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-charcoal py-12">
              Guides coming soon for this category.
            </p>
          )}
        </div>
      </section>

      <ResourcesCategoryOverview onSelectCategory={handleCategorySelect} />

      <ResourcesStarterGuide />

      <ResourcesCuratedReading onDownload={openGuide} />

      <Footer />
    </div>
  );
}
