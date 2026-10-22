"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { capturePayPal } from "@/lib/paypal";

const PENDING_ORDER_KEY = "pending_paypal_order_id";
const PENDING_TYPE_KEY = "pending_paypal_type";

// Approval can lag the redirect by a moment; re-check a few times before giving up.
const PENDING_RETRY_ATTEMPTS = 3;
const PENDING_RETRY_DELAY_MS = 3000;

function readPendingPayPal() {
  try {
    return {
      orderId: sessionStorage.getItem(PENDING_ORDER_KEY),
      type: sessionStorage.getItem(PENDING_TYPE_KEY),
    };
  } catch (_) {
    return { orderId: null, type: null };
  }
}

function clearPendingPayPal() {
  try {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    sessionStorage.removeItem(PENDING_TYPE_KEY);
  } catch (_) {}
}

function successPathForType(type) {
  switch (type) {
    case "consultation":
    case "contribution_before":
      return "/user/consult?paypal=success";
    case "contribution_after":
      return "/user/consult";
    case "store":
      return "/user/checkout/success";
    default:
      return "/user/home";
  }
}

function cancelPathForType(type) {
  switch (type) {
    case "consultation":
    case "contribution_before":
      return "/user/consult/schedule";
    case "contribution_after":
      return "/user/consult";
    case "store":
      return "/user/checkout";
    default:
      return "/user/home";
  }
}

function followUpPathForType(type) {
  if (type === "store") return "/user/menu/purchase_history";
  return "/user/consult";
}

const PENDING_APPROVAL_MESSAGE =
  "PayPal hasn't confirmed this payment yet. If you completed it, it will be confirmed automatically within a few minutes — you don't need to pay again.";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function PayPalCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startedRef = useRef(false);
  const [statusText, setStatusText] = useState("Processing PayPal payment...");
  // 'processing' | 'pending' | 'error' | 'signin'
  const [phase, setPhase] = useState("processing");
  const [nextPath, setNextPath] = useState("/user/home");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const pending = readPendingPayPal();
    const status = searchParams.get("status") || "success";
    const orderId = searchParams.get("token") || searchParams.get("orderId") || pending.orderId;
    const type = searchParams.get("type") || pending.type || "store";

    if (status === "cancel") {
      setStatusText("Payment was cancelled.");
      if (window.opener) {
        window.opener.postMessage(
          { type: "PAYPAL_CANCELLED" },
          window.location.origin
        );
        setTimeout(() => window.close(), 800);
      } else {
        clearPendingPayPal();
        router.replace(cancelPathForType(type));
      }
      return;
    }

    // Success flow
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "PAYPAL_APPROVAL_COMPLETE",
          orderId: orderId,
        },
        window.location.origin
      );
      setStatusText("Payment approved! Returning to Ambe Wellness...");
      setTimeout(() => window.close(), 800);
      return;
    }

    // Direct redirect fallback (no opener popup)
    if (!orderId) {
      clearPendingPayPal();
      router.replace("/user/home");
      return;
    }

    const finalize = async () => {
      setStatusText("Finalizing payment with server...");
      try {
        let data = null;
        for (let attempt = 0; attempt < PENDING_RETRY_ATTEMPTS; attempt++) {
          data = await capturePayPal(orderId, { waitForApproval: true });
          if (data?.success || !data?.pending) break;
          if (attempt < PENDING_RETRY_ATTEMPTS - 1) await wait(PENDING_RETRY_DELAY_MS);
        }

        if (data?.success) {
          clearPendingPayPal();
          router.replace(successPathForType(data.type || type));
          return;
        }

        if (data?.pending) {
          setNextPath(followUpPathForType(type));
          setStatusText(PENDING_APPROVAL_MESSAGE);
          setPhase("pending");
          return;
        }

        throw new Error("Unexpected response from PayPal service.");
      } catch (err) {
        console.error("Direct capture error:", err);
        if (err?.code === "functions/unauthenticated") {
          setStatusText(
            "Your PayPal payment was received. Please sign in to Ambé Wellness — we'll finish processing it automatically, so you don't need to pay again."
          );
          setPhase("signin");
          return;
        }
        if (err?.code === "functions/failed-precondition") {
          setNextPath(followUpPathForType(type));
          setStatusText(PENDING_APPROVAL_MESSAGE);
          setPhase("pending");
          return;
        }
        setNextPath(followUpPathForType(type));
        setStatusText(
          "We couldn't verify your payment right now. If PayPal charged you, it will be confirmed automatically — please check your account shortly or contact info@ambewellness.com."
        );
        setPhase("error");
      }
    };

    // Runs once (startedRef); the server capture is idempotent anyway.
    finalize();
  }, [searchParams, router]);

  const isProcessing = phase === "processing";

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 max-w-sm w-full text-center shadow-sm space-y-4">
        {isProcessing && (
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8996A] border-t-transparent mx-auto" />
        )}
        <h2 className="font-semibold text-[#1A1A1A] text-lg">PayPal Confirmation</h2>
        <p className="text-xs text-[#6B6862]">{statusText}</p>
        {!isProcessing && (
          <button
            type="button"
            onClick={() => router.replace(phase === "signin" ? "/login" : nextPath)}
            className="w-full bg-[#C8996A] hover:bg-[#b5875a] text-white font-semibold py-3 rounded-full text-sm transition"
          >
            {phase === "signin" ? "Sign In" : "Continue"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PayPalCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8996A] border-t-transparent" />
        </div>
      }
    >
      <PayPalCallbackContent />
    </Suspense>
  );
}
