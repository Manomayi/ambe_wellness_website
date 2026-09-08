import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";

/**
 * Initiates a PayPal checkout order and opens approval flow.
 *
 * @param {Object} params
 * @param {number} params.amountCents - Amount in cents (e.g. 5000 for $50.00)
 * @param {string} params.type - 'store' | 'consultation' | 'subscription'
 * @param {number} [params.referralCreditsToUse=0]
 * @param {string} [params.currency='usd']
 * @param {Function} params.onSuccess - Callback upon successful capture ({ orderId })
 * @param {Function} [params.onError] - Callback upon error (err)
 * @param {Function} [params.onCancel] - Callback if user cancels
 */
export async function startPayPalCheckout({
  amountCents,
  type,
  referralCreditsToUse = 0,
  currency = "usd",
  onSuccess,
  onError,
  onCancel,
}) {
  try {
    if (typeof window === "undefined") return;

    const returnUrl = `${window.location.origin}/paypal-callback?type=${encodeURIComponent(type)}&status=success`;
    const cancelUrl = `${window.location.origin}/paypal-callback?type=${encodeURIComponent(type)}&status=cancel`;

    // 1. Create order on server via Firebase Cloud Function
    const createPayPalOrderFn = httpsCallable(functions, "createPayPalOrder");
    const result = await createPayPalOrderFn({
      amount: amountCents,
      currency: currency.toLowerCase(),
      type,
      referral_credits_to_use: referralCreditsToUse,
      return_url: returnUrl,
      cancel_url: cancelUrl,
    });

    if (!result.data || !result.data.approveUrl || !result.data.orderId) {
      throw new Error("Invalid response from PayPal service.");
    }

    const { orderId, approveUrl } = result.data;

    // Store in sessionStorage as backup for redirect scenarios
    sessionStorage.setItem("pending_paypal_order_id", orderId);
    sessionStorage.setItem("pending_paypal_type", type);

    // 2. Open centered popup window
    const width = 500;
    const height = 700;
    const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
    const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

    const popup = window.open(
      approveUrl,
      "PayPalCheckoutWindow",
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no,resizable=yes`
    );

    // 3. Fallback to redirect if popup is blocked
    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      console.warn("[PayPal] Popup blocked, redirecting in same window");
      window.location.href = approveUrl;
      return;
    }

    // 4. Listen for completion from callback window
    let isCompleted = false;

    const cleanup = () => {
      window.removeEventListener("message", messageListener);
      if (checkInterval) clearInterval(checkInterval);
    };

    const messageListener = async (event) => {
      if (event.origin !== window.location.origin) return;

      if (
        event.data?.type === "PAYPAL_APPROVAL_COMPLETE" &&
        (event.data?.orderId === orderId || !event.data?.orderId)
      ) {
        isCompleted = true;
        cleanup();
        try {
          // Capture the order
          const captureFn = httpsCallable(functions, "capturePayPalOrder");
          const captureRes = await captureFn({ orderId });
          sessionStorage.removeItem("pending_paypal_order_id");
          sessionStorage.removeItem("pending_paypal_type");
          if (onSuccess) {
            await onSuccess({ orderId, data: captureRes.data });
          }
        } catch (capErr) {
          console.error("[PayPal] Capture failed:", capErr);
          if (onError) onError(capErr);
        }
      } else if (event.data?.type === "PAYPAL_CANCELLED") {
        isCompleted = true;
        cleanup();
        if (onCancel) onCancel();
      }
    };

    window.addEventListener("message", messageListener);

    // Watch for manual user close of the popup
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        cleanup();
        if (!isCompleted) {
          // Popup was closed without message
          if (onCancel) onCancel();
        }
      }
    }, 1000);
  } catch (err) {
    console.error("[PayPal] Error starting checkout:", err);
    if (onError) onError(err);
    else alert(err.message || "Failed to start PayPal checkout.");
  }
}

/**
 * Direct capture function for PayPal order ID
 */
export async function capturePayPal(orderId) {
  const captureFn = httpsCallable(functions, "capturePayPalOrder");
  const res = await captureFn({ orderId });
  return res.data;
}
