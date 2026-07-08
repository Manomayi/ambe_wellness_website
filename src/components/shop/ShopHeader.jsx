"use client";

import Link from "next/link";
import Image from "next/image";
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
        <Link href="/" className="shop-logo">
          <Image
            src="/images/logos/ambe_logo.png"
            alt="Ambé Wellness"
            width={110}
            height={36}
            priority
          />
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
