"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyActionCode,
  checkActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
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

  const router = useRouter();
  const [status, setStatus] = useState("working"); // working | success | error | needsPassword
  const [error, setError] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [role, setRole] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const platform = useMemo(detectPlatform, []);
  const isMobile = platform === "android" || platform === "ios";
  const ranRef = useRef(false);
  const autoOpenedRef = useRef(false);

  const isFromApp = continueUrl?.includes("source=app");

  const targetWebPath = useMemo(() => {
    if (role === "doctor") return "/doctor/schedule";
    if (role === "user") return "/user/menu/questionnaire";
    if (continueUrl) {
      try {
        const parsed = new URL(continueUrl, "https://ambewellness.com");
        const r = parsed.searchParams.get("role");
        if (r === "doctor") return "/doctor/schedule";
        if (r === "user") return "/user/menu/questionnaire";
        if (
          parsed.origin === "https://ambewellness.com" &&
          parsed.pathname !== "/auth/continue" &&
          parsed.pathname !== "/auth/action"
        ) {
          return `${parsed.pathname}${parsed.search}`;
        }
      } catch {}
    }
    return "/user/menu/questionnaire";
  }, [role, continueUrl]);

  const openApp = useCallback(() => {
    const fallback =
      typeof window !== "undefined" ? window.location.href : "https://ambewellness.com";
    if (platform === "android") {
      window.location.href = androidIntentUrl(fallback);
    } else {
      window.location.replace(`${APP_SCHEME_HOST}?source=web`);
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
          // Refresh local session & check doctor/user role
          try {
            await auth.currentUser?.reload();
            await auth.currentUser?.getIdToken(true);
            if (auth.currentUser) {
              const docSnap = await getDoc(doc(db, "doctors", auth.currentUser.uid));
              setRole(docSnap.exists() ? "doctor" : "user");
            }
          } catch {
            /* not signed in on this device — fine */
          }
          setStatus("success");
          return;
        }

        setStatus("error");
        setError("Unsupported link type.");
      } catch (err) {
        if (mode === MODE_VERIFY && err?.code === "auth/invalid-action-code") {
          try {
            await auth.currentUser?.reload();
          } catch {
            /* no session on this device */
          }
          if (auth.currentUser?.emailVerified) {
            setStatus("success");
          } else {
            setStatus("used");
          }
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

  // ---- Web flow: Auto-redirect to next step ------------------------------
  useEffect(() => {
    if (status !== "success" || mode !== MODE_VERIFY) return;
    if (isFromApp) return;
    if (autoOpenedRef.current) return;

    const timer = setTimeout(() => {
      autoOpenedRef.current = true;
      setRedirecting(true);
      router.push(targetWebPath);
    }, 1500);

    return () => clearTimeout(timer);
  }, [status, mode, isFromApp, targetWebPath, router]);

  // ---- Hand off to the native app on success (App flow only) -------------
  useEffect(() => {
    if (status !== "success" || mode !== MODE_VERIFY) return;
    if (!isFromApp || !isMobile || forceWeb || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    if (platform === "ios") {
      openApp();
    } else {
      const t = setTimeout(openApp, 600);
      return () => clearTimeout(t);
    }
  }, [status, mode, isFromApp, isMobile, forceWeb, platform, openApp]);

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

      {status === "used" && (
        <Centered
          icon={<ExclamationTriangleIcon className="w-8 h-8 text-[#C2691C]" />}
          title="Link Already Used"
          body="This verification link has already been opened. If you have already verified, continue in the app — otherwise request a new link from the verification screen."
        >
          {isMobile && !forceWeb && (
            <button
              type="button"
              onClick={openApp}
              className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white cursor-pointer"
            >
              <DevicePhoneMobileIcon className="w-4 h-4" />
              Open the app
            </button>
          )}
          <PrimaryLink href="/login" muted={isMobile && !forceWeb}>
            Back to Sign In
          </PrimaryLink>
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
          icon={<CheckCircleIcon className="w-8 h-8 text-[#4CAF50]" />}
          title="Email Verified"
          body={
            accountEmail
              ? `${accountEmail} is confirmed. ${redirecting ? "Redirecting to your next step..." : "You can continue your registration."}`
              : redirecting
              ? "Redirecting to your next step..."
              : "Your email is confirmed. You can continue your registration."
          }
        >
          {isFromApp && isMobile ? (
            <>
              <button
                type="button"
                onClick={openApp}
                className="w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1E1E1E] hover:bg-white cursor-pointer"
              >
                <DevicePhoneMobileIcon className="w-4 h-4" />
                Continue in the app
              </button>
              <PrimaryLink href={targetWebPath} muted>
                Continue in this browser
              </PrimaryLink>
            </>
          ) : (
            <PrimaryLink href={targetWebPath}>
              <span className="inline-flex items-center justify-center gap-2">
                <span>
                  {redirecting
                    ? "Redirecting..."
                    : role === "doctor"
                    ? "Set Up Consultation Schedule"
                    : "Complete Wellness Questionnaire"}
                </span>
                <ArrowRightIcon className="w-4 h-4" />
              </span>
            </PrimaryLink>
          )}
        </Centered>
      )}

      {status === "success" && mode === MODE_RESET && (
        <Centered
          icon={<CheckCircleIcon className="w-8 h-8 text-[#4CAF50]" />}
          title="Password Updated"
          body="You can now sign in with your new password."
        >
          <PrimaryLink href="/login">Sign In</PrimaryLink>
        </Centered>
      )}

      {status === "success" && mode === MODE_RECOVER && (
        <Centered
          icon={<CheckCircleIcon className="w-8 h-8 text-[#4CAF50]" />}
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
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-md w-full">
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
        <div className="bg-[#2D2D30] p-7 sm:p-10 rounded-3xl shadow-2xl border border-white/10 text-center text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

function Centered({ icon, title, body, children }) {
  return (
    <>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E1E1E] mb-5 border border-[#FFD3AC]/30">
        {icon}
      </div>
      <h1
        className="text-2xl sm:text-3xl font-medium mb-2 select-none text-white"
        style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
        }}
      >
        {title}
      </h1>
      {body && (
        <p className="text-sm leading-relaxed mb-6 text-[#B0AAA0]">
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
          ? "block w-full py-3 rounded-full text-xs font-medium uppercase tracking-[0.12em] transition-all border border-white/20 text-white hover:bg-white/10"
          : "block w-full px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1E1E1E] hover:bg-white"
      }
    >
      {children}
    </Link>
  );
}
