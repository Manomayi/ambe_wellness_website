"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import {
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

/**
 * Landing page for the `continueUrl` on our verification emails.
 *
 * Handles both web and mobile flows:
 * - When source === 'web' (or on web signup): stays on the web and auto-redirects
 *   to the appropriate next step (doctor -> /doctor/schedule, patient -> /user/home).
 * - When source === 'app': offers handoff back to the mobile app.
 */

const APP_SCHEME_HOST = "panacea://emailverified";
const ANDROID_PACKAGE = "com.ambe.wellnessapp";

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
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "ios";
  return "other";
}

export default function ContinueHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const queryRole = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState(queryRole || "user");
  const [isDoctor, setIsDoctor] = useState(queryRole === "doctor");
  const [redirecting, setRedirecting] = useState(false);

  const platform = useMemo(detectPlatform, []);
  const isMobile = platform === "android" || platform === "ios";
  const autoOpenedRef = useRef(false);

  // If source is explicitly 'app', user originated from mobile app.
  // Otherwise, if source is 'web' or on desktop/web session, user continues on web.
  const isFromApp = source === "app";

  const nextWebPath = isDoctor ? "/doctor/schedule" : "/user/menu/questionnaire";

  const openApp = useCallback(() => {
    const fallback =
      typeof window !== "undefined" ? window.location.href : "https://ambewellness.com";
    if (platform === "android") {
      window.location.href = androidIntentUrl(fallback);
    } else {
      window.location.href = `${APP_SCHEME_HOST}?source=web`;
    }
  }, [platform]);

  // Refresh session & determine user role from Firestore
  useEffect(() => {
    (async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          await auth.currentUser.getIdToken(true);
          if (auth.currentUser.email) setEmail(auth.currentUser.email);

          // Check if doctor in Firestore
          const doctorDoc = await getDoc(doc(db, "doctors", auth.currentUser.uid));
          if (doctorDoc.exists()) {
            setIsDoctor(true);
            setRole("doctor");
          } else {
            setIsDoctor(queryRole === "doctor");
            setRole(queryRole || "user");
          }
        }
      } catch (err) {
        console.warn("ContinueHandler session reload error:", err);
      }
    })();
  }, [queryRole]);

  // Web flow: Auto-redirect to next step (doctor/schedule or user/home)
  useEffect(() => {
    if (isFromApp) return;
    if (autoOpenedRef.current) return;

    const timer = setTimeout(() => {
      autoOpenedRef.current = true;
      setRedirecting(true);
      router.push(nextWebPath);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isFromApp, nextWebPath, router]);

  // App flow: Mobile handoff
  useEffect(() => {
    if (!isFromApp || !isMobile || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    const t = setTimeout(openApp, 600);
    return () => clearTimeout(t);
  }, [isFromApp, isMobile, openApp]);

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full">
        {/* Brand Header with App Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block transition-opacity hover:opacity-80 select-none">
            <Image
              src="/images/logos/ambe_logo.png"
              alt="Ambé Wellness"
              width={180}
              height={50}
              className="w-[160px] sm:w-[190px] h-auto mx-auto"
              priority
            />
          </Link>
        </div>

        <div className="bg-[#2D2D30] p-7 sm:p-10 rounded-3xl shadow-2xl border border-white/10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E1E1E] mb-5 border border-[#FFD3AC]/30">
            <CheckCircleIcon className="w-8 h-8 text-[#4CAF50]" />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-medium mb-2 select-none text-white"
            style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            }}
          >
            Email Verified
          </h1>

          <p className="text-sm leading-relaxed mb-6 text-[#B0AAA0]">
            {email
              ? `${email} is confirmed. ${redirecting ? "Redirecting to your next step..." : "You can continue your registration."}`
              : redirecting
              ? "Redirecting to your next step..."
              : "Your email is confirmed. You can continue your registration."}
          </p>

          <div className="space-y-3">
            {isFromApp && isMobile ? (
              <>
                <button
                  type="button"
                  onClick={openApp}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1E1E1E] hover:bg-white cursor-pointer"
                >
                  <DevicePhoneMobileIcon className="w-4 h-4" />
                  Continue in the Ambé App
                </button>
                <Link
                  href={nextWebPath}
                  className="block w-full py-3 rounded-full text-xs font-medium uppercase tracking-[0.12em] transition-all border border-white/20 text-white hover:bg-white/10"
                >
                  Continue in this browser
                </Link>
              </>
            ) : (
              <Link
                href={nextWebPath}
                className="flex items-center justify-center gap-2 w-full px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1E1E1E] hover:bg-white cursor-pointer"
              >
                <span>
                  {redirecting
                    ? "Redirecting..."
                    : isDoctor
                    ? "Set Up Consultation Schedule"
                    : "Complete Wellness Questionnaire"}
                </span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
