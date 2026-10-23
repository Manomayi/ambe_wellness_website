import { functions } from "@/lib/firebase/config";
import { httpsCallable } from "firebase/functions";

const POPUP_NAME = "PayPalCheckoutWindow";
const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 700;

// Server-side approval polling (covers popups whose postMessage never arrives,
// e.g. iOS Safari tabs or a buyer who finishes in the PayPal app).
const POLL_START_DELAY_MS = 8000;
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_DURATION_MS = 15 * 60 * 1000;

const PENDING_ORDER_KEY = "pending_paypal_order_id";
const PENDING_TYPE_KEY = "pending_paypal_type";

function clearPendingPayPalOrder() {
  try {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
    sessionStorage.removeItem(PENDING_TYPE_KEY);
  } catch (_) {}
}

function isPopupUsable(popup) {
  return Boolean(popup) && typeof popup.closed !== "undefined" && !popup.closed;
}

function closePopup(popup) {
  try {
    if (isPopupUsable(popup)) popup.close();
  } catch (_) {}
}

/**
 * Records a client-side checkout lifecycle event into the order's timeline
 * in Firestore and Cloud Logging. Fire-and-forget; never throws.
 */
export async function logPayPalClientEvent(orderId, event, { url = null, details = null } = {}) {
  if (!orderId || !event) return;
  try {
    const logFn = httpsCallable(functions, "logPayPalClientEvent");
    await logFn({
      orderId,
      event,
      platform: "Web",
      url,
      details,
    });
  } catch (err) {
    // Fire-and-forget; never disrupt UI
  }
}

/**
 * Opens the PayPal checkout window immediately with a "Connecting to PayPal…"
 * placeholder. MUST be called synchronously inside the user's click handler
 * (before any `await`), otherwise Safari's popup blocker will block it.
 *
 * @returns {Window|null} the opened window, or null if the browser blocked it
 */
export function openPayPalPopup() {
  if (typeof window === "undefined") return null;

  const left = window.screenX + Math.max(0, (window.outerWidth - POPUP_WIDTH) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - POPUP_HEIGHT) / 2);

  let popup = null;
  try {
    popup = window.open(
      "",
      POPUP_NAME,
      `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},status=no,toolbar=no,menubar=no,resizable=yes`
    );
  } catch (_) {
    popup = null;
  }

  if (!isPopupUsable(popup)) return null;

  // Placeholder while the order is created. Throws if a previous checkout
  // window with the same name is still on paypal.com (cross-origin) — harmless.
  try {
    popup.document.title = "PayPal";
    popup.document.body.style.cssText =
      "margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1E1E1E;color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;";
    popup.document.body.textContent = "Connecting to PayPal…";
  } catch (_) {}

  return popup;
}

/**
 * Initiates a PayPal checkout order and opens approval flow.
 *
 * Call it synchronously from the click handler (no `await` before it), or pass
 * a window from `openPayPalPopup()` opened inside the click handler.
 *
 * @param {Object} params
 * @param {number} params.amountCents - Amount in cents (e.g. 5000 for $50.00)
 * @param {string} params.type - 'store' | 'consultation' | 'contribution_before' | 'contribution_after' | 'subscription'
 * @param {number} [params.referralCreditsToUse=0]
 * @param {string} [params.currency='usd']
 * @param {number} [params.contributionAmount] - Contribution part (dollars) included in a consultation total
 * @param {Window|null} [params.popup] - Window pre-opened via openPayPalPopup()
 * @param {Function} params.onSuccess - Called once after a successful capture ({ orderId, data })
 * @param {Function} [params.onError] - Callback upon error (err)
 * @param {Function} [params.onCancel] - Callback if user cancels
 */
export async function startPayPalCheckout({
  amountCents,
  type,
  referralCreditsToUse = 0,
  currency = "usd",
  isTestMode = false,
  doctorUid,
  doctorName,
  appointmentTime,
  userTimezone,
  doctorTimezone,
  consultationId,
  contributionType,
  contributionAmount,
  isInstant,
  plan,
  taxAmount,
  shippingAmount,
  popup: preOpenedPopup,
  onSuccess,
  onError,
  onCancel,
}) {
  if (typeof window === "undefined") return;

  // Open the window before any await so Safari treats it as user-initiated.
  const popup = isPopupUsable(preOpenedPopup) ? preOpenedPopup : openPayPalPopup();

  let orderId;
  let approveUrl;

  try {
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
      isTestMode: Boolean(isTestMode),
      ...(doctorUid ? { doctor_uid: doctorUid } : {}),
      ...(doctorName ? { doctor_name: doctorName } : {}),
      ...(appointmentTime ? { appointment_time: appointmentTime } : {}),
      ...(userTimezone ? { user_timezone: userTimezone } : {}),
      ...(doctorTimezone ? { doctor_timezone: doctorTimezone } : {}),
      ...(consultationId ? { consultation_id: consultationId } : {}),
      ...(contributionType ? { contribution_type: contributionType } : {}),
      ...(contributionAmount !== undefined && contributionAmount !== null
        ? { contribution_amount: Number(contributionAmount) || 0 }
        : {}),
      ...(isInstant !== undefined ? { is_instant: isInstant } : {}),
      ...(plan ? { plan } : {}),
      ...(taxAmount !== undefined && taxAmount !== null ? { tax_amount: taxAmount } : {}),
      ...(shippingAmount !== undefined && shippingAmount !== null ? { shipping_amount: shippingAmount } : {}),
    });

    if (!result.data || !result.data.approveUrl || !result.data.orderId) {
      throw new Error("Invalid response from PayPal service.");
    }

    ({ orderId, approveUrl } = result.data);
    logPayPalClientEvent(orderId, "CHECKOUT_INITIATED", {
      url: approveUrl,
      details: { type, amountCents, popupPreOpened: isPopupUsable(popup) },
    });
  } catch (err) {
    console.error("[PayPal] Error starting checkout:", err);
    closePopup(popup);
    if (onError) onError(err);
    else alert(err.message || "Failed to start PayPal checkout.");
    return;
  }

  // Store in sessionStorage as backup for redirect scenarios
  try {
    sessionStorage.setItem(PENDING_ORDER_KEY, orderId);
    sessionStorage.setItem(PENDING_TYPE_KEY, type);
  } catch (_) {}

  // 2. Fallback to redirect if the popup was blocked (or closed already)
  if (!isPopupUsable(popup)) {
    console.warn("[PayPal] Popup blocked, redirecting in same window");
    logPayPalClientEvent(orderId, "REDIRECT_SAME_TAB", { url: approveUrl });
    window.location.href = approveUrl;
    return;
  }

  // 3. Send the pre-opened window to PayPal
  try {
    logPayPalClientEvent(orderId, "POPUP_NAVIGATED", { url: approveUrl });
    popup.location.href = approveUrl;
  } catch (navErr) {
    console.warn("[PayPal] Could not navigate popup, redirecting in same window:", navErr);
    closePopup(popup);
    logPayPalClientEvent(orderId, "REDIRECT_SAME_TAB_FALLBACK", { url: approveUrl });
    window.location.href = approveUrl;
    return;
  }

  watchPayPalPopup({ popup, orderId, onSuccess, onError, onCancel });
}

/**
 * Waits for the buyer to finish in the popup. Three paths can complete the
 * checkout and may race: the callback page's postMessage, server polling, and
 * the popup closing. The server capture is idempotent; `settled` makes sure
 * onSuccess / onError / onCancel fire at most once.
 */
function watchPayPalPopup({ popup, orderId, onSuccess, onError, onCancel }) {
  const captureFn = httpsCallable(functions, "capturePayPalOrder");
  const startedAt = Date.now();

  let settled = false;
  let approvalMessageReceived = false;
  let pollInFlight = false;
  let pollTimer = null;
  let pollStartTimer = null;
  let closeCheckInterval = null;

  const stopPolling = () => {
    if (pollStartTimer) clearTimeout(pollStartTimer);
    if (pollTimer) clearInterval(pollTimer);
    pollStartTimer = null;
    pollTimer = null;
  };

  const cleanup = () => {
    window.removeEventListener("message", messageListener);
    if (closeCheckInterval) clearInterval(closeCheckInterval);
    closeCheckInterval = null;
    stopPolling();
  };

  const settleSuccess = async (data) => {
    if (settled) return;
    settled = true;
    cleanup();
    closePopup(popup);
    clearPendingPayPalOrder();
    logPayPalClientEvent(orderId, "CLIENT_SETTLED_SUCCESS", {
      details: { appointmentId: data?.appointmentId, type: data?.type },
    });
    if (!onSuccess) return;
    try {
      await onSuccess({ orderId, data });
    } catch (cbErr) {
      console.error("[PayPal] onSuccess handler failed:", cbErr);
      if (onError) onError(cbErr);
    }
  };

  const settleError = (err) => {
    if (settled) return;
    settled = true;
    cleanup();
    closePopup(popup);
    logPayPalClientEvent(orderId, "CLIENT_SETTLED_ERROR", {
      details: { error: err?.message || String(err) },
    });
    if (onError) onError(err);
  };

  const settleCancel = () => {
    if (settled) return;
    settled = true;
    cleanup();
    clearPendingPayPalOrder();
    logPayPalClientEvent(orderId, "CLIENT_SETTLED_CANCEL");
    if (onCancel) onCancel();
  };

  // Returns capture data if the order is captured, null if not approved yet.
  const checkApproval = async () => {
    const res = await captureFn({ orderId, waitForApproval: true });
    return res.data?.success ? res.data : null;
  };

  const poll = async () => {
    if (settled || pollInFlight) return;
    if (Date.now() - startedAt > POLL_MAX_DURATION_MS) {
      stopPolling();
      return;
    }
    pollInFlight = true;
    try {
      const data = await checkApproval();
      if (data) await settleSuccess(data);
    } catch (pollErr) {
      console.warn("[PayPal] Approval poll failed:", pollErr);
    } finally {
      pollInFlight = false;
    }
  };

  const messageListener = async (event) => {
    if (event.origin !== window.location.origin) return;
    if (settled) return;

    if (
      event.data?.type === "PAYPAL_APPROVAL_COMPLETE" &&
      (event.data?.orderId === orderId || !event.data?.orderId)
    ) {
      approvalMessageReceived = true;
      stopPolling();
      logPayPalClientEvent(orderId, "POPUP_POSTMESSAGE_APPROVAL", {
        details: { eventOrderId: event.data?.orderId },
      });
      try {
        const captureRes = await captureFn({ orderId });
        await settleSuccess(captureRes.data);
      } catch (capErr) {
        console.error("[PayPal] Capture failed:", capErr);
        // A concurrent capture (poll / webhook) may have won; re-check once.
        try {
          const data = await checkApproval();
          if (data) {
            await settleSuccess(data);
            return;
          }
        } catch (_) {}
        settleError(capErr);
      }
    } else if (event.data?.type === "PAYPAL_CANCELLED") {
      logPayPalClientEvent(orderId, "POPUP_POSTMESSAGE_CANCEL");
      settleCancel();
    }
  };

  window.addEventListener("message", messageListener);

  pollStartTimer = setTimeout(() => {
    pollStartTimer = null;
    if (settled) return;
    poll();
    pollTimer = setInterval(poll, POLL_INTERVAL_MS);
  }, POLL_START_DELAY_MS);

  // Watch for the popup closing without a completion message
  closeCheckInterval = setInterval(async () => {
    if (settled || approvalMessageReceived) return;
    if (!popup.closed) return;

    clearInterval(closeCheckInterval);
    closeCheckInterval = null;
    stopPolling();

    // One last server check: the buyer may have approved (e.g. in the PayPal
    // app) without the callback page reaching this window.
    try {
      const data = await checkApproval();
      if (data) {
        await settleSuccess(data);
        return;
      }
    } catch (finalErr) {
      console.warn("[PayPal] Final approval check failed:", finalErr);
    }
    if (!approvalMessageReceived) settleCancel();
  }, 1000);
}

/**
 * Direct capture function for PayPal order ID.
 * With `waitForApproval: true` an order the buyer has not approved yet returns
 * `{ success: false, pending: true, status }` instead of throwing.
 */
export async function capturePayPal(orderId, { waitForApproval = false } = {}) {
  const captureFn = httpsCallable(functions, "capturePayPalOrder");
  const res = await captureFn(waitForApproval ? { orderId, waitForApproval: true } : { orderId });
  return res.data;
}

/**
 * Asks the server to finish the signed-in user's approved-but-unfinished
 * PayPal orders (paid, but never made it back to the site).
 */
export async function reconcilePayPalOrders() {
  const reconcileFn = httpsCallable(functions, "reconcilePayPalOrders");
  const res = await reconcileFn({});
  return res.data;
}
