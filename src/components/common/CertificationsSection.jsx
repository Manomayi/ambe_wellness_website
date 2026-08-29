"use client";
import React from "react";
import Image from "next/image";

const CERTIFICATIONS = [
  {
    heading: "Backed By Expertise",
    src: "/images/certifications/iso.png",
    alt: "ISO 22000",
    width: 196,
    height: 190,
    lines: ["ISO 22000 & EU", "Pharmacopoeia", "herbal standards"],
  },
  {
    heading: "Certified For Safety",
    src: "/images/certifications/gdpr.png",
    alt: "GDPR",
    width: 197,
    height: 196,
    lines: ["GDPR-compliant", "data privacy"],
  },
  {
    heading: "Trusted By Design",
    src: "/images/certifications/europharm.png",
    alt: "European Pharmacopoeia",
    width: 128,
    height: 188,
    lines: ["Every supplement", "screened for drug", "interactions"],
  },
];

function CertificationCard({
  heading,
  src,
  alt,
  width,
  height,
  lines,
}) {
  return (
    <div className="flex flex-col h-full w-full bg-white/90 sm:bg-[#FAF8F5]/95 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl border border-[#E7E2D9] shadow-sm transition-transform hover:scale-[1.02]">
      <div className="text-center mb-3 sm:mb-6">
        <h3
          className="!text-xs sm:!text-lg md:!text-xl lg:!text-2xl xl:!text-[1.75rem] font-medium font-heading leading-tight min-h-[1.75rem] sm:min-h-[2.75rem] md:min-h-[3.25rem] flex items-center justify-center"
          style={{ color: "#353535" }}
        >
          {heading}
        </h3>
      </div>
      <div className="flex flex-1 flex-col items-center justify-start text-center">
        <div className="w-full h-14 sm:h-28 md:h-32 lg:h-36 mb-3 sm:mb-6 flex items-center justify-center shrink-0">
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="max-h-full max-w-full w-auto h-auto object-contain"
            />
          </div>
        </div>
        <p className="text-[11px] sm:text-sm md:text-base leading-tight sm:leading-relaxed font-medium sm:font-normal" style={{ color: "#353535" }}>
          {lines.map((line, index) => (
            <React.Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}

export default function CertificationsSection() {
  return (
    <div className="py-16 sm:py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Horizontal 3-column layout on all screen sizes (mobile & desktop) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
          {CERTIFICATIONS.map((certification) => (
            <CertificationCard key={certification.heading} {...certification} />
          ))}
        </div>
      </div>
    </div>
  );
}
