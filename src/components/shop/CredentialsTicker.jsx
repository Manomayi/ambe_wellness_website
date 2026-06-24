"use client";

const ITEMS = [
  "GMP Certified Manufacturing",
  "FDA-Registered Facility",
  "GMO Free & Purest Quality",
  "Prop 65 Compliant",
  "Sustainably & Ethically Sourced",
  "Time-Tested Formulas",
  "From the Ancient Vedic Tradition That Gave the World Yoga",
  "ISO & EU Pharmacopoeia Standards",
  "Ships from the US",
  "350+ Classical & Proprietary Formulas",
  "Third-Party Quality Tested",
];

export default function CredentialsTicker() {
  const loop = [...ITEMS, ...ITEMS];

  return (
    <div className="shop-creds-band">
      <div className="shop-creds-track">
        {loop.map((item, i) => (
          <span key={`${item}-${i}`} aria-hidden={i >= ITEMS.length}>
            <b>✦</b> {item}
          </span>
        ))}
      </div>
    </div>
  );
}
