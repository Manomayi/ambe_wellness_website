"use client";

import React from "react";
import VideoBackground from "@/components/common/VideoBackground";

export const ROI_STATS = [
  {
    value: "70%",
    title: "Reduction in Absenteeism",
    desc: "Measurable within 90 days",
  },
  {
    value: "80%",
    title: "Improved Retention Scores",
    desc: "Employees stay longer, perform better",
  },
  {
    value: "↓",
    title: "Reduced Insurance Costs",
    desc: "Fewer conventional medical visits = lower premiums",
  },
  {
    value: "↑",
    title: "Tax-Advantaged Benefits",
    desc: "Wellness programs qualify for employer tax benefits through our partners",
  },
];

export function EnterpriseRoiGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full mt-8 sm:mt-10">
      {ROI_STATS.map((s) => (
        <div
          key={s.title}
          className="rounded-2xl border p-5 sm:p-6 text-center backdrop-blur-sm transition-transform hover:-translate-y-0.5"
          style={{
            borderColor: "rgba(255,255,255,0.18)",
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="font-heading text-3xl sm:text-4xl font-semibold mb-2 sm:mb-3 text-ambe-peach">
            {s.value}
          </div>
          <div className="font-heading text-base sm:text-lg mb-1.5 sm:mb-2 text-ambe-cream font-medium">
            {s.title}
          </div>
          <p className="text-xs sm:text-sm leading-relaxed text-ambe-cream/80">
            {s.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function EnterpriseRoiStats() {
  return (
    <section className="ent-roi-band ent-video-section w-full py-8 sm:py-12">
      <VideoBackground className="ent-video" />
      <div className="ent-video-overlay" aria-hidden />

      <div className="ent-video-content max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
        <EnterpriseRoiGrid />
      </div>
    </section>
  );
}
