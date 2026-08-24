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
    description: 'Receive email notifications for consultations, updates, and practice alerts.',
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

export default function DoctorNotificationsSettingsPage() {
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
        const docRef = doc(db, 'doctors', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          const emailPref =
            data.notification_preferences?.email ??
            data.notification_preferences?.email_appointments ??
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
      await updateDoc(doc(db, 'doctors', user.uid), {
        'notification_preferences.email': preferences.email,
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-4 border-t-4 border-[#C8996A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <BackButton href="/doctor/menu" label="Back to Menu" />
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Notification Settings</h1>
        <p className="text-sm text-[#6B6862] mt-1">
          Manage your email notification preferences.
        </p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {saved && <p className="text-sm text-[#2E7D32]">Preferences saved successfully.</p>}

      <div className="space-y-4">
        {TOGGLES.map((item) => (
          <div
            key={item.key}
            className="flex items-start justify-between gap-4 p-4 bg-white border border-[#E7E2D9] rounded-xl shadow-sm"
          >
            <div>
              <p className="font-medium text-sm text-[#1A1A1A]">{item.label}</p>
              <p className="text-xs text-[#6B6862] mt-1">{item.description}</p>
            </div>
            <Toggle
              checked={!!preferences[item.key]}
              onChange={(value) => handleToggle(item.key, value)}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-3 rounded-lg font-semibold shadow transition ${
          saving
            ? 'bg-[#8C827A] text-white cursor-not-allowed'
            : 'bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white cursor-pointer'
        }`}
      >
        {saving ? 'Saving…' : 'Save Preferences'}
      </button>
    </div>
  );
}
