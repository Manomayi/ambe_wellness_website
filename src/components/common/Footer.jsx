"use client";

import Link from "next/link";
import Image from "next/image";
import { CONTACT_EMAIL } from "@/lib/site-config";

const NAVIGATE_LINKS = [
  { href: "/enterprise", label: "Enterprise" },
  { href: "/membership", label: "Membership" },
  { href: "/resources", label: "Resources" },
  { href: "/download", label: "Download App" },
  { href: "/login", label: "Sign In" },
];

const AREAS_OF_CARE = [
  { href: "/", label: "Hormone Health" },
  { href: "/", label: "Women's Health" },
  { href: "/", label: "Men's Health" },
  { href: "/", label: "Mental Health" },
  { href: "/", label: "Oncology Support" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Contact" },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.2em] uppercase text-ambe-gold font-medium mb-4">
        {title}
      </p>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-ambe-cream/75 hover:text-ambe-gold transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-ambe-dark text-ambe-cream">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logos/ambe_logo.png"
                alt="Ambé Wellness"
                width={120}
                height={40}
                className="w-[120px] h-auto"
              />
            </Link>
            <p className="text-sm text-ambe-cream/70 leading-relaxed max-w-xs">
              Holistic tele-wellness. Real integrative doctors trained in modern
              science and traditional Vedic medicine. Wellness for Everyone.
            </p>
          </div>

          <FooterColumn title="Navigate" links={NAVIGATE_LINKS} />
          <FooterColumn title="Areas of Care" links={AREAS_OF_CARE} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div
          className="pt-8 space-y-4"
          style={{ borderTop: "1px solid rgba(244, 241, 234, 0.15)" }}
        >
          <p className="text-xs text-ambe-cream/60 leading-relaxed max-w-4xl">
            All content provided by Ambé is for educational purposes only and
            does not constitute medical advice, diagnosis, or treatment.
          </p>

          <p className="text-xs text-ambe-cream/60 leading-relaxed">
            © 2026 Ambé Wellness. All rights reserved. Operated by Lakshmi Devi
            Namaha LLC DBA Ambé Wellness.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 text-xs text-ambe-cream/60">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hover:text-ambe-gold transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-ambe-gold transition-colors">
                Terms
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:text-ambe-gold transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
