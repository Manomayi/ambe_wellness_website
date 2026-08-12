"use client";
import React from "react";

const headers = [
  "Feature/Training Area",
  "Nutritionist",
  "Registered Dietitian (RD)",
  "Ayurvedic Doctor",
];

// All 12 rows merged from the previous desktop + mobile tables — [feature, nutritionist, rd, ayurvedic]
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

// Sticky cells need `border-collapse: separate` — with `collapse`, browsers drop
// the borders on stuck cells. Borders are applied per-side instead, with the
// container carrying the top and left edge.
const cellBorders = {
  borderRight: `1px solid ${BORDER_COLOR}`,
  borderBottom: `1px solid ${BORDER_COLOR}`,
};

export default function NutritionistTable() {
  return (
    <>
      <p className="sm:hidden text-xs mb-2 italic" style={{ color: "#7A736A" }}>
        Scroll sideways to compare — the first column stays in view.
      </p>

      <div
        className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0"
        // Labelled and focusable so the scroll region is reachable by keyboard.
        role="region"
        aria-label="Comparison of nutritionist, registered dietitian and Ayurvedic practitioner training"
        tabIndex={0}
      >
        <table
          className="w-full min-w-[760px]"
          style={{
            tableLayout: "fixed",
            borderCollapse: "separate",
            borderSpacing: 0,
            borderTop: `1px solid ${BORDER_COLOR}`,
            borderLeft: `1px solid ${BORDER_COLOR}`,
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
              {headers.map((header, colIndex) => (
                <th
                  key={header}
                  scope="col"
                  className="text-left align-bottom px-4 py-4 sm:px-5 font-bold text-[15px] sm:text-lg leading-tight"
                  style={{
                    ...cellBorders,
                    backgroundColor: HEADER_BG,
                    color: "#353535",
                    // Header stays visible while reading down 12 rows; the first
                    // header cell also pins left, so it sits above both.
                    position: "sticky",
                    top: 0,
                    ...(colIndex === 0
                      ? { left: 0, zIndex: 3 }
                      : { zIndex: 2 }),
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const rowBg = rowIndex % 2 === 0 ? "#FFFFFF" : "#F6F2EC";
              return (
                <tr key={row[0]}>
                  {row.map((cell, colIndex) => {
                    const isFeature = colIndex === 0;
                    return (
                      <td
                        key={colIndex}
                        scope={isFeature ? "row" : undefined}
                        className="align-top px-4 py-4 sm:px-5 text-[13.5px] sm:text-[15px] leading-relaxed"
                        style={{
                          ...cellBorders,
                          // Opaque background is required on the pinned column,
                          // otherwise scrolled content shows through it.
                          backgroundColor: rowBg,
                          color: isFeature ? "#353535" : "#535353",
                          fontWeight: isFeature ? 600 : 400,
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
    </>
  );
}
