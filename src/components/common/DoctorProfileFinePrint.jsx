"use client";
import React from "react";

// Reusable "MEDICAL DIRECTOR" badge — shown on Dr. Smita Bhatia's profile.
export function MedicalDirectorBadge({ className = "" }) {
  return (
    <span
      className={
        "inline-block rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest uppercase " +
        className
      }
      style={{ backgroundColor: "#FFD3AC", color: "#353535" }}
    >
      Medical Director
    </span>
  );
}

// Doctor Profile Fine Print — one reusable block with identical text for every
// practitioner. Appended to the bottom of every doctor profile (View Profile
// modals and booking-flow doctor cards). `className` overrides the container.
export default function DoctorProfileFinePrint({ className = "" }) {
  return (
    <div
      className={"pt-5 " + className}
      style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}
    >
      <div
        className="text-xs font-semibold tracking-widest uppercase mb-2"
        style={{ color: "#C2691C" }}
      >
        Practitioner Credentials &amp; Scope
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#535353" }}>
        This practitioner holds a BAMS degree (Bachelor of Ayurvedic Medicine
        and Surgery) from an accredited institution recognized by India&apos;s
        Central Council of Indian Medicine (CCIM), and has also completed
        allopathic (Western) medical training. This training is not equivalent
        to, and does not confer, medical licensure in the United States.
        Ayurveda is not a state-licensed medical practice in the United States.
        Consultations through Ambé constitute traditional Ayurvedic wellness
        education and support — not the diagnosis or treatment of disease under
        US law. For medical concerns, please consult a licensed physician.
      </p>
    </div>
  );
}
