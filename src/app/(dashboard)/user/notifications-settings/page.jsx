'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';

const DEFAULT_PREFERENCES = {
  email: true,
};

const TOGGLES = [
  {
    key: 'email',
    label: 'Email Notifications',
    description: 'Receive email updates for your consultations, appointments, and wellness alerts.',
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-[#C8996A]' : 'bg-[#E7E2D9]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function UserNotificationsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      try {
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const emailPref =
            data.notification_preferences?.email ??
            data.notifications?.email ??
            true;
          setPreferences({ email: emailPref });
        }
      } catch (e) {
        console.error('Failed to load notification preferences:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleToggle = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');
      await updateDoc(doc(db, 'users', user.uid), {
        'notification_preferences.email': preferences.email,
        'notifications.email': preferences.email,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      setError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-[#E7E2D9] rounded animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-20 bg-[#E7E2D9] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <BackButton fallbackRoute="/user/menu" />
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Notification Settings</h1>
        <p className="text-sm text-[#7A746B] mt-1">
          Manage your email notification preferences.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          Preferences saved successfully.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E7E2D9] divide-y divide-[#E7E2D9] mb-8">
        {TOGGLES.map(({ key, label, description }) => (
          <div key={key} className="p-5 flex items-center justify-between gap-4">
            <div>
              <div className="font-medium text-[#1A1A1A]">{label}</div>
              <div className="text-sm text-[#7A746B] mt-0.5">{description}</div>
            </div>
            <Toggle
              checked={Boolean(preferences[key])}
              onChange={(next) => handleToggle(key, next)}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-[#C8996A] text-white font-medium text-sm hover:bg-[#b58759] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
