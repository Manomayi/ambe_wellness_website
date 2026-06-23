"use client";
import React from "react";

// Continuously scrolling credentials ticker — light, with peach ✦ accents
// between items (matches the ambe-shop-final reference). The track is
// duplicated so the marquee loops seamlessly; animation lives in globals.css.
const DEFAULT_ITEMS = [
  "GMP Certified Manufacturing",
  "FDA-Registered Facility",
  "GMO Free & Purest Quality",
  "80+ Years of Legacy",
  "Third-Party Lab Tested",
  "Prop 65 Compliant",
  "Ships from the US",
];

export default function CredentialsTicker({ items = DEFAULT_ITEMS }) {
  // Render the list twice for a gapless loop.
  const loop = [...items, ...items];

  return (
    <div
      className="w-full overflow-hidden py-4 border-y"
      style={{ borderColor: "#ECE7DE", backgroundColor: "#FBFAF7" }}
    >
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {loop.map((item, i) => (
          <div key={i} className="flex items-center" aria-hidden={i >= items.length}>
            <span className="mx-5 text-sm" style={{ color: "#C8996A" }}>
              ✦
            </span>
            <span
              className="text-xs tracking-[0.18em] uppercase"
              style={{ color: "#7A746B" }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
