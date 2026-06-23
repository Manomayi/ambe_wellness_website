"use client";
import React from "react";

const columns = [
  "AMBÉ",
  "Our Competitors",
  "Others",
  "Nutritionist",
  "DNA Testing Co.",
  "Biomarker Co.",
];

// true = check, false = cross, string = literal value
const rows = [
  { label: "Personalized Consultations", cells: [true, false, true, true, false, false] },
  { label: "Unlimited Messaging", cells: [true, false, false, false, false, false] },
  { label: "Medicines Included", cells: [true, false, false, false, false, false] },
  { label: "Monthly Cost", cells: ["$50", "N/A", "$500+", "$200+", "$299+", "$399+"] },
];

function Cell({ value, isAmbe }) {
  if (value === true) {
    return <span style={{ color: "#FFD3AC" }} className="text-lg">✓</span>;
  }
  if (value === false) {
    return <span style={{ color: "#B5654A" }} className="text-lg">✗</span>;
  }
  // literal value (e.g. prices)
  return (
    <span
      className={isAmbe ? "font-bold" : ""}
      style={{ color: isAmbe ? "#FFD3AC" : "rgba(255,255,255,0.55)" }}
    >
      {value}
    </span>
  );
}

export default function ComparisonGrid() {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[640px]">
        {/* Header row */}
        <div className="grid grid-cols-[1.6fr_repeat(6,1fr)] items-end pb-4">
          <div />
          {columns.map((col) => (
            <div
              key={col}
              className="text-center text-xs sm:text-sm px-1"
              style={{
                color: col === "AMBÉ" ? "#FFD3AC" : "rgba(255,255,255,0.6)",
                fontWeight: col === "AMBÉ" ? 700 : 400,
              }}
            >
              {col}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.6fr_repeat(6,1fr)] items-center py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div
              className="text-sm sm:text-base font-semibold pr-2"
              style={{ color: "white" }}
            >
              {row.label}
            </div>
            {row.cells.map((value, i) => (
              <div key={i} className="text-center text-sm sm:text-base px-1">
                <Cell value={value} isAmbe={i === 0} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
