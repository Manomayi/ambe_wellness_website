"use client";

// Site-wide browser push handling (mounted once in ClientAuthProvider):
//  - keeps web_fcm_token in sync on every visit (the web SDK has no refresh event)
//  - shows an in-page toast for pushes that arrive while the site is visible
//  - navigates when a system notification is clicked (message from the service worker)
//  - shows a one-click "enable notifications" banner on dashboard pages; the
//    browser's own permission prompt only ever appears after that click

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  DUPLICATE_WINDOW_MS,
  enableWebPush,
  getIosInstallState,
  getPermission,
  isWebPushSupported,
  listenForForegroundPush,
  notificationTag,
  shouldShowPrompt,
  showSystemNotification,
  snoozePrompt,
  syncWebPushToken,
} from '@/lib/firebase/messaging';

const TOAST_MS = 6000;
const MAX_TOASTS = 3;
const PROMPT_DELAY_MS = 3000;

function isChatType(type) {
  return type === 'chat_message' || type === 'new_message';
}

export default function WebPushManager() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userType, profile } = useAuth();
  const [toasts, setToasts] = useState([]);
  // false | 'enable' | 'ios-install'
  const [showPrompt, setShowPrompt] = useState(false);
  const [enabling, setEnabling] = useState(false);

  const uid = user?.uid || null;
  const ready = Boolean(uid && user?.emailVerified && userType && profile);
  const profileTokenRef = useRef(profile?.web_fcm_token);
  profileTokenRef.current = profile?.web_fcm_token;
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const recentToastTagsRef = useRef(new Map());

  // 1. Token sync — on page load / login, and again whenever the account has no
  //    browser token at all (e.g. another browser logged out and cleared it).
  //    Deliberately NOT re-run when another browser saves its own token:
  //    reacting to that makes two browsers overwrite each other forever.
  const tokenUnclaimed = ready && !profile?.web_fcm_token;
  useEffect(() => {
    if (!ready) return;
    syncWebPushToken(uid, userType, profileTokenRef.current).catch((e) =>
      console.warn('Web push: token sync failed', e?.message || e)
    );
  }, [ready, uid, userType, tokenUnclaimed]);

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  // 2. Foreground pushes → in-page toast.
  useEffect(() => {
    if (!uid) return undefined;
    let unsubscribe = () => {};
    let cancelled = false;

    listenForForegroundPush((payload) => {
      const data = payload?.data || {};
      // A browser token left on another account must not leak its notifications here.
      if (data.recipientId && data.recipientId !== uid) return;

      // The browser counts the page as visible while it is the active tab, even
      // when the user is working in another app. If the page doesn't have focus,
      // show a system notification instead of an in-page toast nobody will see.
      if (!document.hasFocus()) {
        showSystemNotification(data).catch(() => {});
        return;
      }

      // Already looking at this conversation — the chat updates live.
      const current = pathnameRef.current || '';
      const chatId = data.chatId || data.chat_id;
      if (isChatType(data.type)) {
        if (current.startsWith('/user/consult/message_doctor')) return;
        if (chatId && current === `/doctor/messages/${chatId}`) return;
      }

      // Same appointment event twice within seconds (sent by two backend flows): one toast.
      const tag = notificationTag(data);
      if (tag && !tag.startsWith('chat-')) {
        const lastShown = recentToastTagsRef.current.get(tag) || 0;
        if (Date.now() - lastShown < DUPLICATE_WINDOW_MS) return;
        recentToastTagsRef.current.set(tag, Date.now());
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((list) =>
        [
          ...list,
          {
            id,
            title: data.title || payload?.notification?.title || 'Ambe Wellness',
            body: data.body || payload?.notification?.body || '',
            path: data.web_path || null,
          },
        ].slice(-MAX_TOASTS)
      );
      setTimeout(() => dismissToast(id), TOAST_MS);
    })
      .then((unsub) => {
        if (cancelled) unsub();
        else unsubscribe = unsub;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, dismissToast]);

  // 3. System notification clicked while a tab was open → navigate here.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
    const onMessage = (event) => {
      if (event.data?.type === 'ambe-push-click' && typeof event.data.path === 'string' && event.data.path.startsWith('/')) {
        router.push(event.data.path);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [router]);

  // 4. Soft prompt — dashboard pages only, never on load-blocking paths.
  const onDashboard = /^\/(user|doctor)\//.test(pathname || '');
  useEffect(() => {
    if (!ready || !onDashboard) {
      setShowPrompt(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!shouldShowPrompt()) return;
      // iPhone/iPad in a browser tab: push is only possible from the Home Screen app.
      if (getIosInstallState() === 'needs-install') {
        if (!cancelled) setShowPrompt('ios-install');
        return;
      }
      const supported = await isWebPushSupported();
      if (!cancelled && supported && getPermission() === 'default') {
        setShowPrompt('enable');
      }
    }, PROMPT_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, onDashboard]);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      await enableWebPush(uid, userType);
      setShowPrompt(false);
    } catch (e) {
      // Usually Brave with Google push services off: permission is granted but the
      // browser's push service refuses to issue a token.
      console.warn('Web push: enable failed', e?.name, e?.message || e);
      setShowPrompt('failed');
    } finally {
      setEnabling(false);
    }
  };

  const handleNotNow = () => {
    snoozePrompt();
    setShowPrompt(false);
  };

  const openToast = (toast) => {
    dismissToast(toast.id);
    if (toast.path) router.push(toast.path);
  };

  return (
    <>
      {toasts.length > 0 && (
        <div
          className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[100] flex flex-col gap-3"
          role="status"
          aria-live="polite"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-start gap-3 p-4 rounded-2xl bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 shadow-xl text-white"
            >
              <button
                type="button"
                onClick={() => openToast(toast)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <p className="font-semibold text-sm text-[#FFD3AC] truncate">{toast.title}</p>
                {toast.body && <p className="text-sm text-white/80 mt-0.5 line-clamp-2">{toast.body}</p>}
              </button>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-white/50 hover:text-white text-lg leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {showPrompt === 'enable' && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] p-4 rounded-2xl bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <p className="font-semibold text-sm">Turn on browser notifications?</p>
          <p className="text-sm text-white/70 mt-1">
            Get notified about appointments, messages and updates while you&apos;re away from this tab.
          </p>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={handleNotNow}
              className="px-4 py-2 rounded-full text-sm text-white/80 hover:text-white cursor-pointer"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleEnable}
              disabled={enabling}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#FFD3AC] text-[#1A1A1A] hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {enabling ? 'Enabling…' : 'Enable'}
            </button>
          </div>
        </div>
      )}

      {showPrompt === 'failed' && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] p-4 rounded-2xl bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <p className="font-semibold text-sm">Notifications couldn&apos;t be turned on</p>
          <p className="text-sm text-white/70 mt-1">
            This browser blocked its push service. If you use Brave, open Settings → Privacy and turn on
            &ldquo;Use Google services for push messaging&rdquo;, restart Brave, then enable notifications
            from Notification Settings.
          </p>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#FFD3AC] text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showPrompt === 'ios-install' && (
        <div className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[90] p-4 rounded-2xl bg-[#2A2A2A]/95 backdrop-blur-md border border-white/10 shadow-xl text-white">
          <p className="font-semibold text-sm">Get notifications on your iPhone</p>
          <p className="text-sm text-white/70 mt-1">
            Tap the Share button, choose &ldquo;Add to Home Screen&rdquo;, then open Ambé from your Home
            Screen to turn on notifications.
          </p>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={handleNotNow}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#FFD3AC] text-[#1A1A1A] hover:bg-white transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
