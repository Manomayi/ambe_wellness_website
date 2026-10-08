"use client";

// "Browser notifications" card for the user/doctor notification settings pages.
// Applies to this browser only — it never touches the mobile app's push token.

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  disableWebPush,
  enableWebPush,
  getIosInstallState,
  getPermission,
  isOptedOut,
  isWebPushSupported,
} from '@/lib/firebase/messaging';

export default function BrowserPushSetting() {
  const { user, userType } = useAuth();
  // 'loading' | 'ios-install' | 'unsupported' | 'denied' | 'off' | 'on'
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const refresh = async () => {
    if (getIosInstallState() === 'needs-install') return setState('ios-install');
    if (!(await isWebPushSupported())) return setState('unsupported');
    const permission = getPermission();
    if (permission === 'denied') return setState('denied');
    setState(permission === 'granted' && !isOptedOut() ? 'on' : 'off');
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleToggle = async () => {
    if (!user || !userType || busy) return;
    setBusy(true);
    setNote('');
    try {
      if (state === 'on') await disableWebPush(user.uid, userType);
      else await enableWebPush(user.uid, userType);
    } catch (e) {
      console.warn('Web push: toggle failed', e?.message || e);
      // Typically Brave with Google push services off, or a blocked push service.
      setNote(
        'Couldn’t turn on notifications in this browser. If you use Brave, enable “Use Google services for push messaging” in Settings → Privacy, then try again.'
      );
      await disableWebPush(user.uid, userType).catch(() => {});
    } finally {
      await refresh();
      setBusy(false);
    }
  };

  if (state === 'loading') return null;

  const checked = state === 'on';
  const description = {
    'ios-install':
      'On iPhone or iPad: tap the Share button, choose “Add to Home Screen”, then open Ambé from your Home Screen and turn this on there. Requires iOS 16.4 or later.',
    unsupported:
      getIosInstallState() === 'installed'
        ? 'Push notifications need iOS 16.4 or later. Update your iPhone or iPad to turn them on.'
        : 'This browser doesn’t support push notifications. In Brave, enable “Use Google services for push messaging” in Settings → Privacy.',
    denied:
      'Notifications are blocked for this site. Click the lock icon next to the address bar, allow Notifications, then reload the page.',
    off: 'Get a pop-up on this computer for appointments, messages and updates when you’re not on this tab.',
    on: 'You’ll get pop-ups on this browser. Your mobile app notifications are not affected.',
  }[state];

  return (
    <div className="flex items-start justify-between gap-4 p-4 bg-white border border-[#E7E2D9] rounded-xl shadow-sm">
      <div>
        <p className="font-medium text-sm text-[#1A1A1A]">Browser Notifications</p>
        <p className="text-xs text-[#6B6862] mt-1">{description}</p>
        {note && <p className="text-xs text-red-600 mt-2">{note}</p>}
      </div>
      {(state === 'on' || state === 'off') && (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label="Browser notifications"
          onClick={handleToggle}
          disabled={busy}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
            checked ? 'bg-[#C8996A]' : 'bg-[#E7E2D9]'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      )}
    </div>
  );
}
