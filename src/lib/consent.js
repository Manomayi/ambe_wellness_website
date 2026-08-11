// Shared consent / first-visit sequencing keys.
//
// The Ayurveda Disclaimer is shown when a visitor enters the booking flow — not
// on a general first visit — so browsing the marketing site is never gated by a
// medical acknowledgement. See isBookingRoute below for what counts.
//
// The cookie banner and the 8-second email capture are independent of it: they
// appear on first visit anywhere. They only defer while the disclaimer is
// actually on screen, so the two never stack on a booking route.

export const DISCLAIMER_ACK_KEY = "ambe_disclaimer_v1"; // 'true' once acknowledged
export const DISCLAIMER_ACK_EVENT = "ambe:disclaimer-acknowledged";
export const EMAIL_SESSION_SHOWN_KEY = "ambe_email_capture_shown";
export const COOKIE_CONSENT_KEY = "ambe_cookie_consent"; // 'accepted' | 'declined'

// Entry points to booking a consultation. `/signup` is where every "Book Free
// Consult" CTA lands (CONSULT_HREF); the dashboard routes are the scheduling
// flow itself.
export const BOOKING_ROUTE_PREFIXES = [
  "/signup",
  "/user/get-matched",
  "/user/consult",
];

export function isBookingRoute(pathname) {
  if (!pathname) return false;
  return BOOKING_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// True only after the Ayurveda Disclaimer has been acknowledged. Client-only.
export function isDisclaimerSatisfied() {
  return localStorage.getItem(DISCLAIMER_ACK_KEY) === "true";
}

// True when the disclaimer is about to occupy the screen — i.e. the visitor is
// entering the booking flow and hasn't acknowledged it yet. Other prompts wait
// on this rather than on acknowledgement itself, so they aren't suppressed on
// pages where the disclaimer never appears.
export function isDisclaimerPending(pathname) {
  return isBookingRoute(pathname) && !isDisclaimerSatisfied();
}

// Mark the disclaimer acknowledged and notify any prompts waiting on it (cookie
// banner, email capture) so they can appear without a page reload.
export function acknowledgeDisclaimer() {
  localStorage.setItem(DISCLAIMER_ACK_KEY, "true");
  window.dispatchEvent(new Event(DISCLAIMER_ACK_EVENT));
}
