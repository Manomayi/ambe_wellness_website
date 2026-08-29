"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

/**
 * Firebase email action handler (Console > Authentication > Templates > action URL).
 *
 * The same URL serves every email template, so this page must handle all three
 * modes — not just verifyEmail — otherwise pointing Firebase here would silently
 * break password resets.
 *
 * On mobile this path is also registered as an Android App Link / iOS Universal
 * Link (see public/.well-known/), so tapping the link in a mail client normally
 * hands off to the native app before this page ever loads. This page is the
 * fallback for desktop, for browsers, and for devices without the app.
 */

const MODE_VERIFY = "verifyEmail";
const MODE_RESET = "resetPassword";
const MODE_RECOVER = "recoverEmail";

const APP_SCHEME_HOST = "panacea://emailverified";
const ANDROID_PACKAGE = "com.ambe.wellnessapp";

// Keep in sync with the intent-filter in android/app/src/main/AndroidManifest.xml.
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

/** Firebase rejects an already-consumed oobCode. That is a success from the
 *  user's point of view — the link was simply opened twice (commonly because the
 *  native app already applied it). */
function isAlreadyUsedCode(err) {
  const code = err?.code || "";
  return code === "auth/invalid-action-code" || code === "auth/expired-action-code";
}

export default function AuthActionHandler() {
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const continueUrl = searchParams.get("continueUrl");
  // Set by the native app when it bounces a non-verifyEmail link back out to the
  // browser, so we never ping-pong between app and browser.
  const forceWeb = searchParams.get("web") === "1";

  const [status, setStatus] = useState("working"); // working | success | error | needsPassword
  const [error, setError] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const platform = useMemo(detectPlatform, []);
  const isMobile = platform === "android" || platform === "ios";
  const ranRef = useRef(false);
  const autoOpenedRef = useRef(false);

  const webContinueHref = useMemo(() => {
    if (!continueUrl) return "/login";
    try {
      const parsed = new URL(continueUrl, "https://ambewellness.com");
      // Only follow same-origin continue URLs — an attacker-supplied continueUrl
      // must never turn this page into an open redirect.
      if (parsed.origin !== "https://ambewellness.com") return "/login";
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return "/login";
    }
  }, [continueUrl]);

  const openApp = useCallback(() => {
    const fallback =
      typeof window !== "undefined" ? window.location.href : "https://ambewellness.com";
    if (platform === "android") {
      window.location.href = androidIntentUrl(fallback);
    } else {
      window.location.href = `${APP_SCHEME_HOST}?source=web`;
    }
  }, [platform]);

  // ---- Run the action once, on mount -------------------------------------
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    if (!mode || !oobCode) {
      setStatus("error");
      setError("This link is missing information. Please open the most recent email we sent you.");
      return;
    }

    (async () => {
      try {
        if (mode === MODE_RESET) {
          const email = await verifyPasswordResetCode(auth, oobCode);
          setAccountEmail(email);
          setStatus("needsPassword");
          return;
        }

        if (mode === MODE_VERIFY || mode === MODE_RECOVER) {
          try {
            const info = await checkActionCode(auth, oobCode);
            setAccountEmail(info?.data?.email || "");
          } catch {
            // Non-fatal: we only wanted the email for display.
          }
          await applyActionCode(auth, oobCode);
          // Refresh the local session so an already-signed-in web tab sees the
          // new emailVerified flag without waiting for its poll.
          try {
            await auth.currentUser?.reload();
            await auth.currentUser?.getIdToken(true);
          } catch {
            /* not signed in on this device — fine */
          }
          setStatus("success");
          return;
        }

        setStatus("error");
        setError("Unsupported link type.");
      } catch (err) {
        if (isAlreadyUsedCode(err) && mode === MODE_VERIFY) {
          // Most likely the native app consumed the code first.
          setStatus("success");
          return;
        }
        setStatus("error");
        setError(
          isAlreadyUsedCode(err)
            ? "This link has already been used or has expired. Please request a new one."
            : err?.message || "We could not complete this request. Please try again."
        );
      }
    })();
  }, [mode, oobCode]);

  // ---- Hand off to the native app on success -----------------------------
  useEffect(() => {
    if (status !== "success" || mode !== MODE_VERIFY) return;
    if (!isMobile || forceWeb || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    // Small delay so the success state paints first; if the OS refuses the
    // handoff (in-app browsers often do) the user still sees the button below.
    const t = setTimeout(openApp, 600);
    return () => clearTimeout(t);
  }, [status, mode, isMobile, forceWeb, openApp]);

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("success");
    } catch (err) {
      setError(
        isAlreadyUsedCode(err)
          ? "This reset link has already been used or has expired. Please request a new one."
          : err?.message || "Could not reset your password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      {status === "working" && (
        <Centered
          icon={<ArrowPathIcon className="w-8 h-8 text-[#C2691C] animate-spin" />}
          title="One moment"
          body="Confirming your link…"
        />
      )}

      {status === "error" && (
        <Centered
          icon={<ExclamationTriangleIcon className="w-8 h-8 text-[#B3261E]" />}
          title="Link Not Valid"
          body={error}
        >
          <PrimaryLink href="/login">Back to Sign In</PrimaryLink>
        </Centered>
      )}

      {status === "needsPassword" && (
        <Centered
          icon={<CheckCircleIcon className="w-8 h-8 text-[#C2691C]" />}
          title="Choose a New Password"
          body={accountEmail ? `for ${accountEmail}` : ""}
        >
          <form onSubmit={handleResetSubmit} className="space-y-3 text-left mt-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-[#E7E2D9] bg-[#FAF8F5] text-sm outline-none focus:border-[#C2691C]"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="w-full px-4 py-3 rounded-xl border border-[#E7E2D9] bg-[#FAF8F5] text-sm outline-none focus:border-[#C2691C]"
            />
            {error && <p className="text-xs text-[#B3261E]">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving…" : "Save Password"}
            </button>
          </form>
        </Centered>
      )}

      {status === "success" && mode === MODE_VERIFY && (
        <Centered
          icon={<CheckCircleIcon className="w-8 h-8 text-[#2E7D32]" />}
          title="Email Verified"
          body={
            accountEmail
              ? `${accountEmail} is confirmed. You can continue your registration.`
              : "Your email is confirmed. You can continue your registration."
          }
        >
          {isMobile && !forceWeb && (
            <button
              type="button"
              onClick={openApp}
              className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white cursor-pointer"
            >
              <DevicePhoneMobileIcon className="w-4 h-4" />
              Continue in the Ambé App
            </button>
          )}
          <PrimaryLink href={webContinueHref} muted={isMobile && !forceWeb}>
            Continue in this browser
          </PrimaryLink>
        </Centered>
      )}

      {status === "success" && mode === MODE_RESET && (
        <Centered
          icon={<CheckCircleIcon className="w-8 h-8 text-[#2E7D32]" />}
          title="Password Updated"
          body="You can now sign in with your new password."
        >
          <PrimaryLink href="/login">Sign In</PrimaryLink>
        </Centered>
      )}

      {status === "success" && mode === MODE_RECOVER && (
        <Centered
          icon={<CheckCircleIcon className="w-8 h-8 text-[#2E7D32]" />}
          title="Email Address Restored"
          body="Your sign-in email has been changed back. We recommend resetting your password."
        >
          <PrimaryLink href="/login">Back to Sign In</PrimaryLink>
        </Centered>
      )}
    </Shell>
  );
}

/* ---------------------------------------------------------------- layout */

function Shell({ children }) {
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
          {children}
        </div>
      </div>
    </div>
  );
}

function Centered({ icon, title, body, children }) {
  return (
    <>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF0E6] mb-5 border border-[#FFD3AC]">
        {icon}
      </div>
      <h1
        className="text-2xl sm:text-3xl font-medium mb-2 select-none"
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          color: "#1A1A1A",
        }}
      >
        {title}
      </h1>
      {body && (
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#6B6862" }}>
          {body}
        </p>
      )}
      <div className="space-y-3">{children}</div>
    </>
  );
}

function PrimaryLink({ href, children, muted = false }) {
  return (
    <Link
      href={href}
      className={
        muted
          ? "block w-full py-3 rounded-full text-xs font-medium uppercase tracking-[0.12em] transition-all border border-[#E7E2D9] text-[#1A1A1A] hover:bg-[#FAF8F5]"
          : "block w-full px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
      }
    >
      {children}
    </Link>
  );
}
