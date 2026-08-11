"use client";
import React from "react";
import Image from "next/image";

// One definition per badge, rendered at every breakpoint. Previously the three
// cards were written twice — once for the desktop grid, once for a mobile
// carousel — so copy edits had to be made in both places or they drifted.
const CERTIFICATIONS = [
  {
    heading: "Backed By Expertise",
    src: "/images/certifications/iso.png",
    alt: "ISO 22000",
    width: 144,
    height: 144,
    imageWrapClass: "w-32 h-32 sm:w-28 md:w-32 lg:w-36",
    lines: ["ISO 22000 & EU", "Pharmacopoeia", "herbal standards"],
  },
  {
    heading: "Certified For Safety",
    src: "/images/certifications/gdpr.png",
    alt: "GDPR",
    width: 144,
    height: 144,
    imageWrapClass: "w-32 h-32 sm:w-28 md:w-32 lg:w-36",
    lines: ["GDPR-compliant", "data privacy"],
  },
  {
    heading: "Trusted By Design",
    src: "/images/certifications/europharm.png",
    alt: "European Pharmacopoeia",
    width: 112,
    height: 112,
    imageWrapClass: "w-20 h-20 sm:w-20 md:w-24 lg:w-28",
    // At the 2-column breakpoint the odd third card spans both columns.
    wrapperClass: "sm:col-span-2 lg:col-span-1",
    lines: ["Every supplement", "screened for drug", "interactions"],
  },
];

function CertificationCard({
  heading,
  src,
  alt,
  width,
  height,
  imageWrapClass,
  wrapperClass = "",
  lines,
}) {
  return (
    <div className={`mx-auto w-full max-w-[300px] sm:max-w-none ${wrapperClass}`}>
      <div className="text-center mb-4">
        <div
          className="text-2xl sm:text-3xl font-medium font-heading"
          style={{ color: "#353535" }}
        >
          {heading}
        </div>
      </div>
      <div className="bg-white p-6 sm:p-8 flex flex-col items-center justify-center text-center aspect-square">
        <div className={`${imageWrapClass} mb-4 flex items-center justify-center`}>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="object-contain w-full h-full"
          />
        </div>
        <p className="text-sm sm:text-base" style={{ color: "#353535" }}>
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
    <section
      className="pt-32 pb-20 sm:pt-36 sm:pb-24 md:pt-40 md:pb-32"
      style={{ backgroundColor: "#F4F1EA" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Every badge is visible at every width — stacked on mobile, grid on
            larger screens. No carousel, no swipe. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {CERTIFICATIONS.map((certification) => (
            <CertificationCard key={certification.heading} {...certification} />
          ))}
        </div>
      </div>
    </section>
  );
}
