"use client";
import React from "react";

// DSHEA / FDA-mandated supplement disclaimer. Reusable block rendered below the
// product description and above Add to Cart on every product. FDA wording must
// not be altered.
export default function DsheaDisclaimer({ className = "" }) {
  return (
    <div
      className={"rounded-md p-3 " + className}
      style={{ backgroundColor: "#FBF1E4", border: "1px solid #F2D9BE" }}
    >
      <div
        className="text-[10px] font-semibold tracking-widest uppercase mb-1"
        style={{ color: "#C2691C" }}
      >
        FDA Disclaimer
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "#6B6B6B" }}>
        These statements have not been evaluated by the Food and Drug
        Administration. This product is not intended to diagnose, treat, cure, or
        prevent any disease.
      </p>
    </div>
  );
}
