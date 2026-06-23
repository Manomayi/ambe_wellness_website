"use client";
import React from "react";

const stats = [
  { value: "10,000+", label: "MEMBERS SERVED" },
  { value: "85%", label: "REPORT MEASURABLE IMPROVEMENT" },
  { value: "★★★★★", label: "AVERAGE MEMBER RATING" },
  { value: "55M+", label: "BIOMARKERS ANALYZED" },
];

export default function StatsBar() {
  return (
    <section className="w-full" style={{ backgroundColor: "#353535" }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={
                "flex flex-col items-center text-center px-4 py-4 md:py-0" +
                (index > 0 ? " md:border-l md:border-white/15" : "")
              }
            >
              <div
                className="text-3xl sm:text-4xl font-medium mb-2"
                style={{ color: "#FFD3AC", fontFamily: "Richmond" }}
              >
                {stat.value}
              </div>
              <div
                className="text-[11px] sm:text-xs tracking-wider uppercase leading-snug"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
