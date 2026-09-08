"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { capturePayPal } from "@/lib/paypal";

function PayPalCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [statusText, setStatusText] = useState("Processing PayPal payment...");

  useEffect(() => {
    const status = searchParams.get("status") || "success";
    const orderId = searchParams.get("token") || searchParams.get("orderId");
    const type = searchParams.get("type") || "store";

    if (status === "cancel") {
      setStatusText("Payment was cancelled.");
      if (window.opener) {
        window.opener.postMessage(
          { type: "PAYPAL_CANCELLED" },
          window.location.origin
        );
        setTimeout(() => window.close(), 800);
      } else {
        if (type === "consultation") {
          router.push("/user/consult/schedule");
        } else {
          router.push("/user/checkout");
        }
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
    } else {
      // Direct redirect fallback (no opener popup)
      if (orderId) {
        setStatusText("Finalizing payment with server...");
        capturePayPal(orderId)
          .then(() => {
            if (type === "consultation") {
              router.push("/user/consult/schedule?paypal_success=true");
            } else {
              router.push("/user/checkout/success");
            }
          })
          .catch((err) => {
            console.error("Direct capture error:", err);
            setStatusText("Failed to verify payment. Please check your account.");
          });
      } else {
        router.push("/user/home");
      }
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-6">
      <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 max-w-sm w-full text-center shadow-sm space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8996A] border-t-transparent mx-auto" />
        <h2 className="font-semibold text-[#1A1A1A] text-lg">PayPal Confirmation</h2>
        <p className="text-xs text-[#6B6862]">{statusText}</p>
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
