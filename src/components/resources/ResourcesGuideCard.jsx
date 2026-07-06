"use client";

import Image from "next/image";

export default function ResourcesGuideCard({ guide, onDownload }) {
  return (
    <article
      className="flex flex-col h-full overflow-hidden"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      <div className="relative w-full aspect-[4/3] bg-[#E8E3DA] overflow-hidden">
        <Image
          src={guide.image}
          alt={guide.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-col flex-1 px-5 sm:px-6 pt-5 pb-6">
        <p className="text-[11px] sm:text-xs tracking-[0.2em] uppercase text-ambe-gold font-medium mb-3">
          {guide.category}
        </p>

        <h3 className="font-heading !text-lg sm:!text-xl !text-charcoal !font-normal leading-snug mb-3">
          {guide.title}
        </h3>

        <p className="text-sm text-charcoal/90 leading-relaxed mb-6 flex-1">
          {guide.summary}
        </p>

        <button
          type="button"
          onClick={() => onDownload(guide.downloadTitle)}
          className="text-[11px] sm:text-xs tracking-[0.15em] uppercase text-ambe-gold hover:text-charcoal transition-colors cursor-pointer text-left font-medium"
        >
          Download Free →
        </button>
      </div>
    </article>
  );
}
