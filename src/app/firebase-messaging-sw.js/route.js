// Serves /firebase-messaging-sw.js — the service worker that shows browser push
// notifications while the site is in the background or closed.
//
// It is generated here (rather than living in public/) so it reads the same
// NEXT_PUBLIC_FIREBASE_* env vars as src/lib/firebase/config.js.
//
// Pushes are data-only (see functions/push_service.js), so this worker builds the
// notification itself and FCM never shows a second copy.

export const dynamic = 'force-dynamic';

// Keep in step with the `firebase` version in package.json.
const FIREBASE_COMPAT_VERSION = '11.6.1';

function buildServiceWorker(config) {
  return `/* Ambe Wellness — Firebase Cloud Messaging service worker (generated) */

// Registered before Firebase loads so this handler sees clicks first.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.path) || '/';
  const target = new URL(path, self.location.origin);

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const sameOrigin = windows.filter((client) => new URL(client.url).origin === target.origin);
    const appWindow =
      sameOrigin.find((client) => /^\\/(user|doctor)\\//.test(new URL(client.url).pathname)) ||
      sameOrigin[0];
    if (appWindow) {
      await appWindow.focus();
      // The page navigates itself (WebPushManager, mounted site-wide, listens for this).
      appWindow.postMessage({ type: 'ambe-push-click', path: target.pathname + target.search });
      return;
    }
    await self.clients.openWindow(target.href);
  })());
});

// Same tag => the new notification replaces the old one instead of stacking.
// Chat: one per conversation. Appointment events: one per type + appointment, so
// the duplicate some backend flows send (e.g. two functions on one reschedule)
// collapses into a single notification.
function tagFor(data) {
  const chatId = data.chatId || data.chat_id;
  if (chatId) return 'chat-' + chatId;
  const apptId = data.appointmentId || data.appointment_id || data.consultationId || data.consultation_id;
  if (apptId && data.type) return data.type + '-' + apptId;
  return undefined;
}

const DUPLICATE_WINDOW_MS = 15000;

async function showFromData(data) {
  const tag = tagFor(data);
  let renotify = Boolean(tag);
  if (tag && !tag.startsWith('chat-')) {
    // Same appointment event again within seconds: update silently, don't alert
    // twice. (Chat always alerts — each message is new.)
    const existing = await self.registration.getNotifications({ tag });
    if (existing.some((n) => Date.now() - ((n.data && n.data.shownAt) || 0) < DUPLICATE_WINDOW_MS)) {
      renotify = false;
    }
  }
  return self.registration.showNotification(data.title || 'Ambe Wellness', {
    body: data.body || '',
    icon: '/images/app-icons/icon-192.png',
    badge: '/images/favicons/leaf_48.png',
    tag,
    renotify,
    data: { path: data.web_path || '/', shownAt: Date.now() },
  });
}

// Safari (iPhone, iPad and Mac) revokes push permission if a push arrives and no
// notification is shown. Firebase skips the notification while the site is open
// (it hands the message to the page instead), so on Safari this handler shows
// every push itself and stops Firebase's handler from running.
const ua = self.navigator.userAgent || '';
const IS_SAFARI = /AppleWebKit/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR|Android/.test(ua);
if (IS_SAFARI) {
  self.addEventListener('push', (event) => {
    let payload = {};
    try {
      payload = event.data ? event.data.json() : {};
    } catch (e) {
      payload = {};
    }
    event.stopImmediatePropagation();
    const data = payload.data || {};
    const notification = payload.notification || {};
    event.waitUntil(showFromData({
      ...data,
      title: data.title || notification.title,
      body: data.body || notification.body,
    }));
  });
}

importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/${FIREBASE_COMPAT_VERSION}/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config)});

const messaging = firebase.messaging();

// Runs only when no tab of the site is visible (and never on Safari — see above).
messaging.onBackgroundMessage((payload) => {
  // A message with a notification block is already shown by FCM — don't duplicate it.
  if (payload.notification) return;
  return showFromData(payload.data || {});
});
`;
}

export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return new Response(buildServiceWorker(config), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      // Browsers must always re-check the worker so fixes roll out promptly.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
