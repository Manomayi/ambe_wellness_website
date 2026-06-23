import React from "react";
import Link from "next/link";
import ShopHeader from "@/components/shop/ShopHeader";
import CredentialsTicker from "@/components/shop/CredentialsTicker";
import ShopClient from "@/components/shop/ShopClient";
import { getProducts } from "@/lib/shop/products";

export const metadata = {
  title: "Shop — Ambé Wellness",
  description:
    "Doctor-curated Ayurvedic formulas, herbal supplements, and wellness essentials. Order directly and ship to your door — no consultation required.",
};

const ACCENT = "#C8996A";
const SERIF = "'Cormorant Garamond', serif";

const HERO_BADGES = [
  "GMP Certified",
  "80+ Years of Legacy",
  "GMO Free",
  "Ships from the US",
  "Prop 65 Compliant",
];

// Server component: reads the catalog and hands it to the client grid so
// products render dynamically (no hard-coded cards).
export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-white">
      <ShopHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pt-14 sm:pt-20 pb-10">
        <div
          className="text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-4"
          style={{ color: ACCENT }}
        >
          Ambé Wellness Shop
        </div>
        <h1
          className="text-4xl sm:text-5xl md:text-6xl mb-6"
          style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
        >
          Remedies{" "}
          <span style={{ color: ACCENT, fontStyle: "italic" }}>made for you.</span>
        </h1>
        <p
          className="text-base sm:text-lg max-w-xl mb-8 leading-relaxed"
          style={{ color: "#6B6B6B" }}
        >
          Doctor-curated Ayurvedic formulas, herbal supplements, and wellness
          essentials. No consultation required — order directly and ship to your
          door.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {HERO_BADGES.map((b) => (
            <span key={b} className="flex items-center text-sm" style={{ color: "#6B6B6B" }}>
              <span className="mr-2" style={{ color: ACCENT }}>
                ✦
              </span>
              {b}
            </span>
          ))}
        </div>
      </section>

      {/* Credentials ticker — scrolls continuously */}
      <CredentialsTicker />

      {/* Doctor's Picks CTA band */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pt-14 sm:pt-20 pb-4">
        <div
          className="text-xs sm:text-sm font-medium tracking-[0.25em] uppercase mb-4"
          style={{ color: ACCENT }}
        >
          Doctor&apos;s Picks
        </div>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl mb-5"
          style={{ fontFamily: SERIF, color: "#2E2E2E", fontWeight: 500 }}
        >
          Not sure where to start?{" "}
          <span style={{ color: ACCENT, fontStyle: "italic" }}>We can help.</span>
        </h2>
        <p className="text-base max-w-xl mb-8 leading-relaxed" style={{ color: "#6B6B6B" }}>
          Book a free consultation and your Ayurvedic doctor will build a
          personalized remedy protocol for your specific constitution — no
          guesswork.
        </p>
        <Link
          href="/membership"
          className="inline-block px-8 py-3 rounded-full text-xs sm:text-sm font-medium tracking-[0.18em] uppercase transition-all duration-200 bg-[#FFD3AC] text-[#2E2E2E] hover:bg-[#2E2E2E] hover:text-white"
        >
          Book Free Consult
        </Link>
      </section>

      {/* Product grid + filters */}
      <section className="max-w-6xl mx-auto px-6 sm:px-8 pt-10 pb-16 sm:pb-20">
        <ShopClient products={products} />
      </section>

      {/* Footer disclaimer */}
      <footer className="border-t" style={{ borderColor: "#ECE7DE" }}>
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-12 text-center">
          <p className="text-xs leading-relaxed" style={{ color: "#A8A29A" }}>
            These statements have not been evaluated by the Food and Drug
            Administration. Products sold on this page are not intended to
            diagnose, treat, cure, or prevent any disease. All Ambé Wellness
            products are sourced from Kerala Ayurveda, a GMP-certified
            manufacturer with 80+ years of Ayurvedic legacy, producing 350+
            classical and proprietary herbal formulations. Products are
            GMO-free, Prop 65 compliant, sustainably and ethically sourced, and
            meet ISO 22000 and European Pharmacopoeia quality benchmarks.
            Third-party tested for purity, potency, microbial safety, heavy
            metals, and pesticides. For personalized guidance on which products
            are right for your constitution,{" "}
            <Link href="/membership" style={{ color: ACCENT }}>
              book a free consultation
            </Link>{" "}
            with an Ambé doctor.
          </p>
        </div>
      </footer>
    </div>
  );
}
