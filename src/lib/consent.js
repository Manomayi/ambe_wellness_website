// Shared consent / first-visit sequencing keys aligned with Flutter WellnessNoticeService.
//
// The Ayurveda Disclaimer is shown when a user enters the consultation/booking flow
// (e.g. /user/consult/schedule, /user/consult, /user/get-matched) — NOT on /signup or
// general browsing.
//
// Acceptance is persisted to the user record in Firestore (`users/{uid}.ayurvedic_wellness_notice`)
// for audit trail and cross-platform parity with the Flutter mobile app, plus localStorage
// for device-level caching.

export const DISCLAIMER_VERSION = "v1";
export const DISCLAIMER_FIELD = "ayurvedic_wellness_notice";
export const DISCLAIMER_ACK_KEY = "ayurvedic_wellness_notice_version"; // 'v1' matching Flutter
export const DISCLAIMER_LEGACY_KEY = "ambe_disclaimer_v1"; // legacy key support
export const DISCLAIMER_ACK_EVENT = "ambe:disclaimer-acknowledged";
export const EMAIL_SESSION_SHOWN_KEY = "ambe_email_capture_shown";
export const COOKIE_CONSENT_KEY = "ambe_cookie_consent"; // 'accepted' | 'declined'

// Entry points to booking / consultation where legal notice is required.
// Matches Flutter ScheduleConsultationPage, ActiveConsultationView, etc.
export const BOOKING_ROUTE_PREFIXES = [
  "/user/get-matched",
  "/user/consult",
];

export function isBookingRoute(pathname) {
  if (!pathname) return false;
  return BOOKING_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

// True only after the Ayurveda Disclaimer has been acknowledged.
export function isDisclaimerSatisfied(user, profile) {
  // If user is logged in, their Firestore user record is the primary source of truth
  if (user?.uid) {
    const record = profile?.[DISCLAIMER_FIELD];
    if (record && typeof record === "object") {
      return record.accepted === true && record.version === DISCLAIMER_VERSION;
    }
    return false;
  }

  // Device-level check for unauthenticated or pre-auth check
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(DISCLAIMER_ACK_KEY) === DISCLAIMER_VERSION ||
      localStorage.getItem(DISCLAIMER_LEGACY_KEY) === "true"
    );
  }
  return true;
}

// True when the disclaimer should occupy the screen — i.e. the user is
// entering the consultation flow and hasn't acknowledged it yet.
export function isDisclaimerPending(pathname, user, profile, userType) {
  if (userType === "doctor") return false;
  return isBookingRoute(pathname) && !isDisclaimerSatisfied(user, profile);
}

// Mark the disclaimer acknowledged on device and notify listeners.
export function acknowledgeDisclaimer() {
  if (typeof window !== "undefined") {
    localStorage.setItem(DISCLAIMER_ACK_KEY, DISCLAIMER_VERSION);
    localStorage.setItem(DISCLAIMER_LEGACY_KEY, "true");
    window.dispatchEvent(new Event(DISCLAIMER_ACK_EVENT));
  }
}
