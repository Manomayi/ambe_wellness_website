// src/lib/firebase/messaging.js
//
// Browser push (Firebase Cloud Messaging) for the website.
//
// The browser token is stored in `web_fcm_token` on users/{uid} or doctors/{uid}.
// `fcm_token` belongs to the mobile app — never read or write it from here.
//
// Browser-only: every export guards against running on the server.

import { getMessaging, getToken, deleteToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, getDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import app, { db } from './config';

export const WEB_TOKEN_FIELD = 'web_fcm_token';

// The VAPID public key comes from Secret Manager via /api/web-push-config.
const VAPID_CONFIG_URL = '/api/web-push-config';
const SW_URL = '/firebase-messaging-sw.js';
const SW_SCOPE = '/firebase-cloud-messaging-push-scope';

// localStorage keys (per-browser conveniences only)
const LS_TOKEN = 'ambe_web_push_token'; // { uid, token }
const LS_OPT_OUT = 'ambe_web_push_opt_out'; // '1' when the user turned it off in settings
const LS_PROMPT_DISMISSED = 'ambe_web_push_prompt_dismissed_at';

const PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function lsGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function lsSet(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // storage blocked — fine, these are conveniences
  }
}

function readStoredToken() {
  try {
    return JSON.parse(lsGet(LS_TOKEN) || 'null');
  } catch {
    return null;
  }
}

function profileRef(uid, userType) {
  return doc(db, userType === 'doctor' ? 'doctors' : 'users', uid);
}

let vapidKeyPromise = null;

/** Fetches the VAPID public key once per page load. Resolves null if unavailable. */
function getVapidKey() {
  if (!vapidKeyPromise) {
    vapidKeyPromise = fetch(VAPID_CONFIG_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => (json && typeof json.vapidKey === 'string' && json.vapidKey) || null)
      .catch(() => null)
      .then((key) => {
        // Let a later call retry after a transient failure.
        if (!key) vapidKeyPromise = null;
        return key;
      });
  }
  return vapidKeyPromise;
}

let supportPromise = null;

/** True when this browser can receive web push and the VAPID key is configured. */
export function isWebPushSupported() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (!supportPromise) {
    supportPromise = (async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !window.isSecureContext) {
        return false;
      }
      if (!(await getVapidKey())) {
        supportPromise = null; // retry on the next check
        return false;
      }
      try {
        return await isSupported();
      } catch {
        return false;
      }
    })();
  }
  return supportPromise;
}

/**
 * iPhone/iPad only allow web push once the site is added to the Home Screen and
 * opened from there. 'not-ios' | 'needs-install' | 'installed'
 */
export function getIosInstallState() {
  if (typeof window === 'undefined') return 'not-ios';
  const isIos =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as Mac
  if (!isIos) return 'not-ios';
  const standalone =
    window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
  return standalone ? 'installed' : 'needs-install';
}

/** 'granted' | 'denied' | 'default' | 'unsupported' */
export function getPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function isOptedOut() {
  return lsGet(LS_OPT_OUT) === '1';
}

export function shouldShowPrompt() {
  const dismissedAt = Number(lsGet(LS_PROMPT_DISMISSED) || 0);
  return !isOptedOut() && Date.now() - dismissedAt > PROMPT_SNOOZE_MS;
}

export function snoozePrompt() {
  lsSet(LS_PROMPT_DISMISSED, String(Date.now()));
}

async function getServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existing) {
    // Pick up service worker changes after a deploy.
    existing.update().catch(() => {});
    return existing;
  }
  return navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
}

async function getMessagingIfSupported() {
  if (!(await isWebPushSupported())) return null;
  return getMessaging(app);
}

/**
 * Gets this browser's token and saves it to `web_fcm_token` if it changed.
 * Only runs when permission is already granted and the user hasn't opted out —
 * it never prompts. Call it on every visit (the web SDK has no token-refresh event).
 *
 * The account holds one browser token, and the browser where the user last
 * logged in or enabled notifications keeps it. So this only writes when:
 *  - `force` (the user just clicked Enable), or
 *  - this browser's own token is new/changed since it last saved (fresh login,
 *    token rotation), or
 *  - no browser currently holds the field.
 * It must NOT write just because another browser saved its token — two open
 * browsers would otherwise keep overwriting each other.
 *
 * @param {string} uid
 * @param {'user'|'doctor'} userType
 * @param {string|null|undefined} currentProfileToken - profile.web_fcm_token, if known
 * @param {{force?: boolean}} [options]
 * @returns {Promise<string|null>} the token, or null if not registered
 */
export async function syncWebPushToken(uid, userType, currentProfileToken, { force = false } = {}) {
  if (!uid || !userType || isOptedOut() || getPermission() !== 'granted') return null;
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  const vapidKey = await getVapidKey();
  if (!vapidKey) return null;

  const registration = await getServiceWorkerRegistration();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  if (!token) return null;

  const stored = readStoredToken();
  const changedInThisBrowser = !stored || stored.uid !== uid || stored.token !== token;
  const unclaimed = !currentProfileToken;

  if (currentProfileToken !== token && (force || changedInThisBrowser || unclaimed)) {
    await updateDoc(profileRef(uid, userType), {
      [WEB_TOKEN_FIELD]: token,
      web_token_updated_at: serverTimestamp(),
    });
  }
  lsSet(LS_TOKEN, JSON.stringify({ uid, token }));
  return token;
}

/**
 * Asks for permission (must be called from a click) and registers the token.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export async function enableWebPush(uid, userType) {
  if (!(await isWebPushSupported())) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    lsSet(LS_OPT_OUT, null);
    await syncWebPushToken(uid, userType, undefined, { force: true });
  } else {
    snoozePrompt();
  }
  return permission;
}

/**
 * Detaches this browser from the account: clears `web_fcm_token` (only if it is
 * still this browser's token) and invalidates the browser token.
 * Must run while the user is still signed in. Never throws; capped at ~4s so it
 * can't hold up logout.
 */
export async function clearWebPushToken(uid, userType) {
  if (typeof window === 'undefined' || !uid) return;

  const work = (async () => {
    const stored = readStoredToken();
    const browserToken = stored && stored.uid === uid ? stored.token : null;

    if (browserToken && userType) {
      try {
        const ref = profileRef(uid, userType);
        const snap = await getDoc(ref);
        if (snap.exists() && snap.get(WEB_TOKEN_FIELD) === browserToken) {
          await updateDoc(ref, {
            [WEB_TOKEN_FIELD]: deleteField(),
            web_token_updated_at: deleteField(),
          });
        }
      } catch (e) {
        console.warn('Web push: could not clear token on profile', e?.message || e);
      }
    }

    try {
      const messaging = await getMessagingIfSupported();
      if (messaging && getPermission() === 'granted') await deleteToken(messaging);
    } catch {
      // token may already be gone
    }
    lsSet(LS_TOKEN, null);
  })();

  await Promise.race([work, new Promise((resolve) => setTimeout(resolve, 4000))]);
}

/** Turns web push off for this browser (settings toggle). */
export async function disableWebPush(uid, userType) {
  lsSet(LS_OPT_OUT, '1');
  await clearWebPushToken(uid, userType);
}

/**
 * Shows a system (OS) notification from the page, through the push service
 * worker so a click is handled by its notificationclick handler. Used when the
 * site is the visible tab but the user is working in another app.
 * @returns {Promise<boolean>} whether it was shown
 */
export async function showSystemNotification(data = {}) {
  if (getPermission() !== 'granted' || !('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (!registration) return false;
  const tag = notificationTag(data);
  let renotify = Boolean(tag);
  if (tag && !tag.startsWith('chat-')) {
    const existing = await registration.getNotifications({ tag });
    if (existing.some((n) => Date.now() - (n.data?.shownAt || 0) < DUPLICATE_WINDOW_MS)) renotify = false;
  }
  await registration.showNotification(data.title || 'Ambe Wellness', {
    body: data.body || '',
    icon: '/images/app-icons/icon-192.png',
    badge: '/images/favicons/leaf_48.png',
    tag,
    renotify,
    data: { path: data.web_path || '/', shownAt: Date.now() },
  });
  return true;
}

export const DUPLICATE_WINDOW_MS = 15000;

/**
 * Same key => same notification. Chat: one per conversation. Appointment events:
 * one per type + appointment (some backend flows send the same event twice).
 * Keep in step with tagFor() in the service worker.
 */
export function notificationTag(data = {}) {
  const chatId = data.chatId || data.chat_id;
  if (chatId) return `chat-${chatId}`;
  const apptId = data.appointmentId || data.appointment_id || data.consultationId || data.consultation_id;
  if (apptId && data.type) return `${data.type}-${apptId}`;
  return undefined;
}

/**
 * Listens for pushes while the site is open and visible. Returns an unsubscribe
 * function. While a page is visible the browser does not show a system
 * notification, so the caller shows an in-page toast.
 */
export async function listenForForegroundPush(callback) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
