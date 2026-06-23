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

const BORDER = "1px solid #F5B880";

export default function NutritionistTable() {
  return (
    <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
      <table
        className="w-full min-w-[820px] border-collapse"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "20%" }} />
          <col style={{ width: "23%" }} />
          <col style={{ width: "27%" }} />
          <col style={{ width: "30%" }} />
        </colgroup>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left align-middle px-4 py-3 font-bold text-base sm:text-lg"
                style={{ backgroundColor: "#FFD3AC", color: "#353535", border: BORDER }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row[0]}
              style={{ backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#F4F4F4" }}
            >
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  className="align-top px-4 py-3 text-sm sm:text-base leading-snug"
                  style={{
                    border: BORDER,
                    color: colIndex === 0 ? "#353535" : "#535353",
                    fontWeight: colIndex === 0 ? 600 : 400,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
