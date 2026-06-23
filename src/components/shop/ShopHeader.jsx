"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

// Light header for the shop page (the site's main nav is white-on-dark, meant
// to overlay a video hero, so it doesn't suit this light page). Matches the
// ambe-shop-final reference: logo left, Sign in + BOOK FREE CONSULT right.
export default function ShopHeader() {
  return (
    <header className="w-full bg-white border-b" style={{ borderColor: "#ECE7DE" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/images/logos/ambe_logo.png"
            alt="AMBE"
            width={110}
            height={36}
            className="w-[90px] sm:w-[110px] h-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-5 sm:gap-8">
          <Link
            href="/login"
            className="text-sm"
            style={{ color: "#6B6B6B" }}
          >
            Sign in
          </Link>
          <Link
            href="/membership"
            className="text-xs sm:text-sm font-medium tracking-[0.15em] uppercase"
            style={{ color: "#9A948B" }}
          >
            Book Free Consult
          </Link>
        </div>
      </div>
    </header>
  );
}
