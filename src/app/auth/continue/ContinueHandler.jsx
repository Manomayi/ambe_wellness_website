"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/config";
import {
  CheckCircleIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

/**
 * Landing page for the `continueUrl` on our verification emails.
 *
 * Firebase's own action handler applies the oobCode and then links here, so by
 * the time anyone sees this page the email is already verified — there is no
 * code to act on. This path is registered as an Android App Link / iOS
 * Universal Link, so on a device with the app installed the tap on Firebase's
 * "Continue" button opens the app and this page never renders. It exists for
 * desktop, for devices without the app, and for in-app browsers that refuse the
 * handoff.
 *
 * The cross-domain hop matters on iOS: Universal Links are deliberately ignored
 * when a page links to its own domain, and firebaseapp.com -> ambewellness.com
 * is exactly the case where iOS does honour them.
 */

const APP_SCHEME_HOST = "panacea://emailverified";
const ANDROID_PACKAGE = "com.ambe.wellnessapp";

// Keep in sync with the panacea intent-filter in AndroidManifest.xml.
function androidIntentUrl(fallbackUrl) {
  const fallback = encodeURIComponent(fallbackUrl);
  return (
    `intent://emailverified?source=web#Intent;scheme=panacea;` +
    `package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`
  );
}

function detectPlatform() {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  // iPadOS 13+ reports as Macintosh but is touch-capable.
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  return "other";
}

export default function ContinueHandler() {
  const [email, setEmail] = useState("");
  const platform = useMemo(detectPlatform, []);
  const isMobile = platform === "android" || platform === "ios";
  const autoOpenedRef = useRef(false);

  const openApp = useCallback(() => {
    const fallback =
      typeof window !== "undefined" ? window.location.href : "https://ambewellness.com";
    if (platform === "android") {
      window.location.href = androidIntentUrl(fallback);
    } else {
      window.location.href = `${APP_SCHEME_HOST}?source=web`;
    }
  }, [platform]);

  // Refresh any session held in this browser so a tab sitting on /verify-email
  // sees the new flag immediately rather than waiting for its next poll.
  useEffect(() => {
    (async () => {
      try {
        await auth.currentUser?.reload();
        await auth.currentUser?.getIdToken(true);
        if (auth.currentUser?.email) setEmail(auth.currentUser.email);
      } catch {
        /* no session on this device — expected when signup happened in the app */
      }
    })();
  }, []);

  useEffect(() => {
    if (!isMobile || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    // Paint the success state first; if the OS refuses the handoff the button
    // below is still there.
    const t = setTimeout(openApp, 600);
    return () => clearTimeout(t);
  }, [isMobile, openApp]);

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl sm:text-4xl font-normal tracking-wide transition-opacity hover:opacity-80 select-none"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              color: "#1A1A1A",
            }}
          >
            AMBÉ
          </Link>
          <p
            className="text-xs uppercase tracking-[0.2em] mt-1.5 font-medium"
            style={{ color: "#C2691C" }}
          >
            Integrative Ayurveda
          </p>
        </div>

        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl border border-[#E7E2D9] text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF0E6] mb-5 border border-[#FFD3AC]">
            <CheckCircleIcon className="w-8 h-8 text-[#2E7D32]" />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-medium mb-2 select-none"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              color: "#1A1A1A",
            }}
          >
            Email Verified
          </h1>

          <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B6862" }}>
            {email
              ? `${email} is confirmed. You can continue your registration.`
              : "Your email is confirmed. You can continue your registration."}
          </p>

          <div className="space-y-3">
            {isMobile && (
              <button
                type="button"
                onClick={openApp}
                className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white cursor-pointer"
              >
                <DevicePhoneMobileIcon className="w-4 h-4" />
                Continue in the Ambé App
              </button>
            )}
            <Link
              href="/verify-email"
              className={
                isMobile
                  ? "block w-full py-3 rounded-full text-xs font-medium uppercase tracking-[0.12em] transition-all border border-[#E7E2D9] text-[#1A1A1A] hover:bg-[#FAF8F5]"
                  : "block w-full px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
              }
            >
              Continue in this browser
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
