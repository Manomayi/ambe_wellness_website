"use client";

import Link from "next/link";
import { CONSULT_HREF } from "@/lib/site-config";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Health Technology", href: "/health-technology" },
];

export default function ShopHeader() {
  return (
    <header className="shop-header">
      <div className="shop-nav-inner">
        <Link href="/" className="shop-logo-word">
          AMBE<span className="shop-logo-leaf" />
        </Link>

        <nav className="shop-nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="shop-nav-cta">
          <Link href="/login" className="signin">
            Sign in
          </Link>
          <Link href={CONSULT_HREF} className="shop-btn shop-btn-nav">
            Book Free Consult
          </Link>
        </div>
      </div>
    </header>
  );
}
