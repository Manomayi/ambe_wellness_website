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
  const [compareMode, setCompareMode] = useState("all"); // "all" | "rd" | "nutritionist"

  return (
    <div className="w-full">
      {/* =========================================================================
          MOBILE VIEW (Visible on screens < 768px: md:hidden)
          Simple, clean, easy-to-understand comparison cards
         ========================================================================= */}
      <div className="block md:hidden">
        {/* Simple Top Segmented Switcher */}
        <div className="mb-4">
          <p className="text-xs text-[#7A736A] mb-2 text-center">
            Compare Ayurvedic Doctor with:
          </p>
          <div className="bg-[#F6F1EA] p-1 rounded-xl flex gap-1 border border-[#E9E1D4]">
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
          </div>
        </div>

        {/* Clean, Simple Comparison Cards */}
        <div className="space-y-3">
          {rows.map((row, idx) => {
            const [feature, nutritionist, rd, ayurvedic] = row;
            return (
              <div
                key={feature}
                className="bg-white rounded-2xl border border-[#F5B880]/60 p-4 shadow-xs"
              >
                {/* Feature Name Header */}
                <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-[#F4EFE6]">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FFD3AC] text-[#353535] font-bold text-[11px] shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-sm sm:text-base text-[#353535] leading-snug">
                    {feature}
                  </h3>
                </div>

                {/* Ayurvedic Doctor (AMBÉ Standard) */}
                <div className="bg-[#FFF9F3] border border-[#F5B880]/70 rounded-xl p-3 mb-2.5">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#353535]">
                      🌿 Ayurvedic Doctor
                    </span>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#FFD3AC] text-[#353535]">
                      AMBÉ
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#353535] font-medium leading-relaxed">
                    {ayurvedic}
                  </p>
                </div>

                {/* Registered Dietitian (shown if 'rd' or 'all') */}
                {(compareMode === "rd" || compareMode === "all") && (
                  <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-xl p-3 mb-2">
                    <span className="block text-[11px] font-semibold text-[#666666] mb-0.5">
                      Registered Dietitian (RD)
                    </span>
                    <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                      {rd}
                    </p>
                  </div>
                )}

                {/* Nutritionist (shown if 'nutritionist' or 'all') */}
                {(compareMode === "nutritionist" || compareMode === "all") && (
                  <div className="bg-[#FAF8F5] border border-[#ECE5D8] rounded-xl p-3">
                    <span className="block text-[11px] font-semibold text-[#666666] mb-0.5">
                      Nutritionist
                    </span>
                    <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                      {nutritionist}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
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
                        {isAyurvedic && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/70 text-[#353535] ml-auto">
                            AMBÉ
                          </span>
                        )}
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
