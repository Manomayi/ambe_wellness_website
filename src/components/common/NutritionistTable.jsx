"use client";
import React, { useState } from "react";

const headers = [
  "Feature/Training Area",
  "Nutritionist",
  "Registered Dietitian (RD)",
  "Ayurvedic Doctor",
];

// All 12 rows comparing [feature, nutritionist, rd, ayurvedic]
const rows = [
  [
    "Educational Pathway",
    "Varies widely (certificate to degree)",
    "Accredited BS/MS in Dietetics + 1200+ hrs supervised practice",
    "5.5-year degree (BAMS) or equivalent, with internship in Ayurveda",
  ],
  [
    "Governing Body / License",
    "None or limited (not legally protected)",
    "Licensed by CDR (Commission on Dietetic Registration)",
    "Licensed by Ayurvedic Medical Boards (India and some global orgs)",
  ],
  [
    "Focus of Training",
    "General nutrition, food science",
    "Clinical nutrition, disease-related dietary plans",
    "Mind-body-spirit nutrition, doshas, digestion, daily/life cycles (Dinacharya/Ritucharya)",
  ],
  [
    "Training in Herbs & Botanicals",
    "Minimal to none",
    "Minimal (only within supplement guidelines)",
    "Extensive—hundreds of hours in herbal pharmacology, rasa, virya, vipaka",
  ],
  [
    "View of Food",
    "Macronutrients & calories",
    "Macronutrient & micronutrient balance; pathology-based",
    "Food as medicine (Ahara), categorized by qualities, energetics, season, emotional effects",
  ],
  [
    "Personalization Approach",
    "Generic plans or macro-based diets",
    "Personalized to medical conditions",
    "Deeply individualized based on prakriti, vikriti, agni, and mental/emotional state",
  ],
  [
    "Understanding of Digestion",
    "Caloric intake, GI health (basic)",
    "Detailed GI pathologies, fiber, enzyme responses",
    "Agni theory, ama (toxicity), 13 types of digestive fire, subtle body digestion",
  ],
  [
    "Mind-Body Integration",
    "Rarely addressed",
    "Minimal integration",
    "Central to diagnosis and treatment—mental gunas, emotional causation of imbalance",
  ],
  [
    "Spiritual/Ethical Lens",
    "Not included",
    "Not included",
    "Rooted in Vedic philosophy, karma, and ethics; food impacts consciousness",
  ],
  [
    "Treatment Modalities",
    "Diet plans, calorie tracking",
    "Medical nutrition therapy",
    "Food therapy + herbs, lifestyle routines, detox (Panchakarma), breath, meditation, rituals",
  ],
  [
    "Scope of Practice",
    "Wellness support",
    "Disease prevention & management",
    "Holistic care across mental, physical, and spiritual domains",
  ],
  [
    "Time-Tested Tradition",
    "Modern (~50-100 years of development)",
    "Scientific framework from 20th century",
    "Over 5,000 years of lineage-tested protocols",
  ],
];

const BORDER_COLOR = "#F5B880";
const HEADER_BG = "#FFD3AC";

const cellBorders = {
  borderRight: `1px solid ${BORDER_COLOR}`,
  borderBottom: `1px solid ${BORDER_COLOR}`,
};

export default function NutritionistTable() {
  const [compareMode, setCompareMode] = useState("rd"); // "rd" | "nutritionist" | "all"

  return (
    <div className="w-full">
      {/* =========================================================================
          MOBILE VIEW (Visible on screens < 768px: md:hidden)
          Compact 2-Column Fitted Table (100% screen fit, no horizontal scroll, zero clicks)
         ========================================================================= */}
      <div className="block md:hidden">
        {/* Role Switcher */}
        <div className="mb-3">
          <p className="text-xs text-[#7A736A] mb-2 text-center font-medium">
            Compare Ayurvedic Doctor with:
          </p>
          <div className="bg-[#F6F1EA] p-1 rounded-xl flex gap-1 border border-[#E9E1D4]">
            <button
              type="button"
              onClick={() => setCompareMode("rd")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                compareMode === "rd"
                  ? "bg-[#353535] text-white shadow-xs"
                  : "text-[#535353] hover:text-[#353535]"
              }`}
            >
              vs. Dietitian (RD)
            </button>
            <button
              type="button"
              onClick={() => setCompareMode("nutritionist")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                compareMode === "nutritionist"
                  ? "bg-[#353535] text-white shadow-xs"
                  : "text-[#535353] hover:text-[#353535]"
              }`}
            >
              vs. Nutritionist
            </button>
            <button
              type="button"
              onClick={() => setCompareMode("all")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                compareMode === "all"
                  ? "bg-[#353535] text-white shadow-xs"
                  : "text-[#535353] hover:text-[#353535]"
              }`}
            >
              All 3
            </button>
          </div>
        </div>

        {/* Compact Fitted Table Container */}
        <div className="rounded-2xl border border-[#F5B880] shadow-xs bg-white overflow-hidden">
          {/* Sticky Column Headers */}
          <div className="sticky top-0 z-10 shadow-xs border-b border-[#F5B880]">
            {compareMode !== "all" ? (
              <div className="grid grid-cols-2 divide-x divide-[#F5B880]">
                <div className="bg-[#FFD3AC] px-3 py-3 text-center font-bold text-[13.5px] sm:text-sm text-[#353535] flex items-center justify-center gap-1.5">
                  <span>🌿</span>
                  <span>Ayurvedic Doctor</span>
                </div>
                <div className="bg-[#F4EFE6] px-3 py-3 text-center font-bold text-[13.5px] sm:text-sm text-[#353535]">
                  {compareMode === "rd" ? "Dietitian (RD)" : "Nutritionist"}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 divide-x divide-[#F5B880]">
                <div className="bg-[#FFD3AC] px-1.5 py-2.5 text-center font-bold text-xs text-[#353535] flex items-center justify-center gap-0.5">
                  <span>🌿</span>
                  <span>Ayurvedic</span>
                </div>
                <div className="bg-[#F4EFE6] px-1.5 py-2.5 text-center font-bold text-xs text-[#353535] flex items-center justify-center">
                  Dietitian (RD)
                </div>
                <div className="bg-[#EFE8DD] px-1.5 py-2.5 text-center font-bold text-xs text-[#353535] flex items-center justify-center">
                  Nutritionist
                </div>
              </div>
            )}
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#F5B880]/30">
            {rows.map((row, idx) => {
              const [feature, nutritionist, rd, ayurvedic] = row;

              return (
                <div key={feature}>
                  {/* Category Banner */}
                  <div className="bg-[#FAF6F0] px-3.5 py-2 flex items-center gap-2 border-b border-[#F5B880]/20">
                    <span className="w-5 h-5 rounded-full bg-[#FFD3AC] text-[#353535] font-bold text-[11px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-[13.5px] sm:text-sm text-[#353535]">
                      {feature}
                    </span>
                  </div>

                  {/* 2-Column or 3-Column Content Cells */}
                  {compareMode !== "all" ? (
                    <div className="grid grid-cols-2 divide-x divide-[#F5B880]/30 items-stretch">
                      {/* Left: Ayurvedic Doctor */}
                      <div className="p-3.5 sm:p-4 bg-[#FFFDF9] text-[13.5px] sm:text-sm leading-relaxed text-[#2D2D2D] flex items-start">
                        <p>{ayurvedic}</p>
                      </div>

                      {/* Right: Dietitian or Nutritionist */}
                      <div className="p-3.5 sm:p-4 bg-white text-[13.5px] sm:text-sm leading-relaxed text-[#4A4A4A] flex items-start">
                        <p>{compareMode === "rd" ? rd : nutritionist}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 divide-x divide-[#F5B880]/30 items-stretch">
                      <div className="p-2.5 bg-[#FFFDF9] text-xs leading-relaxed text-[#2D2D2D]">
                        <p>{ayurvedic}</p>
                      </div>
                      <div className="p-2.5 bg-white text-xs leading-relaxed text-[#4A4A4A]">
                        <p>{rd}</p>
                      </div>
                      <div className="p-2.5 bg-[#FCFAF7] text-xs leading-relaxed text-[#4A4A4A]">
                        <p>{nutritionist}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DESKTOP & TABLET VIEW (Visible on screens >= 768px: hidden md:block)
          Full 4-column comparison matrix table with sticky header and elegant styling
         ========================================================================= */}
      <div className="hidden md:block">
        <div
          className="overflow-x-auto rounded-xl border border-[#F5B880] shadow-xs"
          role="region"
          aria-label="Comparison of nutritionist, registered dietitian and Ayurvedic practitioner training"
          tabIndex={0}
        >
          <table
            className="w-full"
            style={{
              tableLayout: "fixed",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <colgroup>
              <col style={{ width: "22%" }} />
              <col style={{ width: "23%" }} />
              <col style={{ width: "26%" }} />
              <col style={{ width: "29%" }} />
            </colgroup>
            <thead>
              <tr>
                {headers.map((header, colIndex) => {
                  const isAyurvedic = colIndex === 3;
                  return (
                    <th
                      key={header}
                      scope="col"
                      className="text-left align-bottom px-5 py-4 font-bold text-base lg:text-lg leading-tight"
                      style={{
                        ...cellBorders,
                        backgroundColor: isAyurvedic ? "#FFD3AC" : HEADER_BG,
                        color: "#353535",
                        position: "sticky",
                        top: 0,
                        ...(colIndex === 0
                          ? { left: 0, zIndex: 3 }
                          : { zIndex: 2 }),
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {isAyurvedic && <span>🌿</span>}
                        <span>{header}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowBg = rowIndex % 2 === 0 ? "#FFFFFF" : "#F6F2EC";
                return (
                  <tr key={row[0]}>
                    {row.map((cell, colIndex) => {
                      const isFeature = colIndex === 0;
                      const isAyurvedic = colIndex === 3;

                      return (
                        <td
                          key={colIndex}
                          scope={isFeature ? "row" : undefined}
                          className="align-top px-5 py-4 text-[14px] lg:text-[15px] leading-relaxed"
                          style={{
                            ...cellBorders,
                            backgroundColor: isAyurvedic
                              ? rowIndex % 2 === 0
                                ? "#FFF9F3"
                                : "#FFF4E8"
                              : rowBg,
                            color: isFeature || isAyurvedic ? "#353535" : "#535353",
                            fontWeight: isFeature
                              ? 600
                              : isAyurvedic
                              ? 500
                              : 400,
                            ...(isFeature
                              ? { position: "sticky", left: 0, zIndex: 1 }
                              : {}),
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
