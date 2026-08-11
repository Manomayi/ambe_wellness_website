"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  COOKIE_CONSENT_KEY,
  DISCLAIMER_ACK_EVENT,
  isDisclaimerPending,
} from "@/lib/consent";

// Sitewide GDPR cookie banner: sticky bottom on first visit, hides once a
// choice is made (remembered in localStorage). It defers only while the
// Ayurveda Disclaimer is actually on screen — on a booking route — so the two
// never stack, while consent is still requested everywhere else on first visit.
export default function CookieConsentBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem(COOKIE_CONSENT_KEY)) return; // already chose
    const show = () => setVisible(true);
    if (!isDisclaimerPending(pathname)) {
      show();
      return;
    }
    // The disclaimer is up on this route — appear once it's acknowledged.
    window.addEventListener(DISCLAIMER_ACK_EVENT, show, { once: true });
    return () => window.removeEventListener(DISCLAIMER_ACK_EVENT, show);
  }, [pathname]);

  const choose = (choice) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[90]"
      style={{ backgroundColor: "#353535" }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>
            We use cookies to personalize your experience and improve our
            services.{" "}
            <Link href="/privacy-policy" className="underline hover:opacity-80" style={{ color: "#FFD3AC" }}>
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link href="/privacy-policy" className="underline hover:opacity-80" style={{ color: "#FFD3AC" }}>
              Cookie Policy
            </Link>
          </p>

          <div className="flex flex-row gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="px-6 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-200 bg-[#FFD3AC] text-[#353535]! hover:bg-white"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() => choose("declined")}
              className="px-6 py-2.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-200 border border-[#FFD3AC] text-[#FFD3AC]! hover:bg-[#FFD3AC] hover:text-[#353535]!"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
