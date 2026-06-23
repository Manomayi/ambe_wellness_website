"use client";

import React from "react";

const STATS = [
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
    value: "H",
    title: "Tax-Advantaged Benefits",
    desc: "Wellness programs qualify for employer tax benefits through our partners",
  },
];

export default function EnterpriseRoiStats() {
  return (
    <section className="w-full py-12 sm:py-16" style={{ backgroundColor: "#1a1a1a" }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border p-6 text-center"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="text-3xl sm:text-4xl font-semibold mb-3"
                style={{ color: "#FFD3AC", fontFamily: "Cormorant Garamond, serif" }}
              >
                {s.value}
              </div>
              <div
                className="text-lg mb-2"
                style={{ color: "#fff", fontFamily: "Cormorant Garamond, serif" }}
              >
                {s.title}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
