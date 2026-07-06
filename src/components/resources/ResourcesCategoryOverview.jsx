"use client";

import { RESOURCE_CATEGORY_OVERVIEW } from "@/lib/resources/categories";

export default function ResourcesCategoryOverview({ onSelectCategory }) {
  const leftColumn = RESOURCE_CATEGORY_OVERVIEW.slice(0, 4);
  const rightColumn = RESOURCE_CATEGORY_OVERVIEW.slice(4, 8);

  return (
    <section className="bg-ambe-dark py-16 sm:py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
        <p className="text-xs tracking-[0.25em] uppercase text-ambe-gold mb-5 font-medium">
          Digital Resources
        </p>

        <h2 className="font-heading !text-3xl sm:!text-4xl md:!text-5xl !text-ambe-cream mb-5">
          Find what you&apos;re looking for.
        </h2>

        <p className="text-ambe-cream/80 text-sm sm:text-base max-w-2xl mx-auto mb-12 sm:mb-16 leading-relaxed">
          All resources are free, doctor-curated, and grounded in both Ayurvedic
          tradition and modern research.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-10 md:gap-12 text-left">
          <div className="space-y-8 sm:space-y-10">
            {leftColumn.map((item) => (
              <CategoryItem
                key={item.category}
                item={item}
                onSelect={onSelectCategory}
              />
            ))}
          </div>

          <div
            className="hidden md:block w-px self-stretch"
            style={{ backgroundColor: "rgba(200, 153, 106, 0.35)" }}
            aria-hidden
          />

          <div className="space-y-8 sm:space-y-10">
            {rightColumn.map((item) => (
              <CategoryItem
                key={item.category}
                item={item}
                onSelect={onSelectCategory}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryItem({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.category)}
      className="flex gap-4 text-left w-full group cursor-pointer"
    >
      <span className="text-2xl shrink-0 mt-0.5" aria-hidden>
        {item.icon}
      </span>
      <span>
        <span className="block font-semibold text-ambe-cream mb-1 group-hover:text-ambe-gold transition-colors">
          {item.category}
        </span>
        <span className="block text-sm text-ambe-cream/70 leading-relaxed">
          {item.description}
        </span>
      </span>
    </button>
  );
}
