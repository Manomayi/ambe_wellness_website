"use client";

import { CURATED_ARTICLES } from "@/lib/resources/articles";

export default function ResourcesCuratedReading({ onDownload }) {
  return (
    <section className="bg-ambe-cream py-14 sm:py-16 md:py-20 border-t border-[#E8E3DA]">
      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-4 mb-10 sm:mb-12">
          <p className="text-[11px] tracking-[0.25em] uppercase text-ambe-gold font-medium sm:justify-self-start">
            All Guides
          </p>

          <h2 className="font-heading !text-4xl sm:!text-[2.75rem] md:!text-5xl !text-charcoal !font-normal !leading-tight text-center sm:col-start-2">
            Doctor-curated reading.
          </h2>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("resource-guides")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="text-[11px] tracking-[0.2em] uppercase text-ambe-gold hover:text-charcoal transition-colors font-medium sm:justify-self-end sm:col-start-3 cursor-pointer"
          >
            View All →
          </button>
        </div>

        <ul className="divide-y divide-[#E0DBD2]">
          {CURATED_ARTICLES.map((article) => (
            <li key={article.id}>
              <button
                type="button"
                onClick={() => onDownload?.(article.title)}
                className="w-full flex items-center gap-6 sm:gap-10 py-7 sm:py-8 text-left group cursor-pointer"
              >
                <span
                  className="font-heading italic text-3xl sm:text-4xl text-ambe-gold/70 shrink-0 w-12 sm:w-14"
                  aria-hidden
                >
                  {article.number}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block font-heading !text-xl sm:!text-2xl !text-charcoal !font-normal mb-1.5 group-hover:!text-ambe-gold transition-colors">
                    {article.title}
                  </span>
                  <span className="block text-sm text-ambe-gold">
                    {article.category} · {article.readTime}
                  </span>
                </span>

                <span
                  className="text-ambe-gold text-lg shrink-0 group-hover:translate-x-1 transition-transform"
                  aria-hidden
                >
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
