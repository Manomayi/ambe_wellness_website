// Shared consent / first-visit sequencing keys.
//
// First-visit order: Ayurveda Disclaimer Modal (item 68) → Cookie Banner →
// 8-second Email Capture modal. The disclaimer owns DISCLAIMER_ACK_KEY and must
// be acknowledged before the other two prompts may appear, so nothing stacks on
// top of the disclaimer.

export const DISCLAIMER_ACK_KEY = "ambe_disclaimer_v1"; // 'true' once acknowledged
export const DISCLAIMER_ACK_EVENT = "ambe:disclaimer-acknowledged";
export const EMAIL_SESSION_SHOWN_KEY = "ambe_email_capture_shown";
export const COOKIE_CONSENT_KEY = "ambe_cookie_consent"; // 'accepted' | 'declined'

// True only after the Ayurveda Disclaimer has been acknowledged. Client-only.
export function isDisclaimerSatisfied() {
  return localStorage.getItem(DISCLAIMER_ACK_KEY) === "true";
}

// Mark the disclaimer acknowledged and notify any prompts waiting on it (cookie
// banner, email capture) so they can appear without a page reload.
export function acknowledgeDisclaimer() {
  localStorage.setItem(DISCLAIMER_ACK_KEY, "true");
  window.dispatchEvent(new Event(DISCLAIMER_ACK_EVENT));
}
