'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';

// Same set of health fields used by the patient-facing GetMatched flow
// (src/components/user/GetMatched.jsx), since doctors are matched against
// these exact values via `doctors/{uid}.field` (array-contains queries).
const HEALTH_FIELDS = [
  { value: 'general_health', label: 'General Health', icon: '🏥' },
  { value: 'womens_health', label: "Women's Health", icon: '👩‍⚕️' },
  { value: 'mens_health', label: "Men's Health", icon: '👨‍⚕️' },
  { value: 'muscular_skeletal', label: 'Muscular Skeletal', icon: '🦴' },
  { value: 'heart_health', label: 'Heart Health', icon: '❤️' },
  { value: 'skin_hair_health', label: 'Skin & Hair Health', icon: '✨' },
  { value: 'mental_emotional_health', label: 'Mental Emotional Health', icon: '🧠' },
  { value: 'digestive_metabolic', label: 'Digestive & Metabolic', icon: '🍎' },
  { value: 'oncology', label: 'Oncology', icon: '🎗️' },
  { value: 'disabilities', label: 'Disabilities', icon: '♿' },
  { value: 'behavorial', label: 'Behavorial', icon: '🧩' },
];

export default function DoctorSpecialtyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [error, setError] = useState('');

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
          setSelectedFields(Array.isArray(data.field) ? data.field : []);
        }
      } catch (e) {
        console.error('Failed to load specialties:', e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const toggleField = (value) => {
    setSelectedFields((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedFields.length === 0) {
      setError('Please select at least one specialty');
      return;
    }
    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');
      await updateDoc(doc(db, 'doctors', user.uid), {
        field: selectedFields,
      });
      router.back();
    } catch (e) {
      console.error(e);
      setError('Update failed');
    } finally {
      setUpdating(false);
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
      <h1 className="text-2xl font-semibold text-[#1A1A1A]">Specialty</h1>
      <p className="text-sm text-[#6B6862]">
        Select all health fields you practice in. Patients are matched to you based on these.
      </p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HEALTH_FIELDS.map((field) => {
            const isSelected = selectedFields.includes(field.value);
            return (
              <button
                key={field.value}
                type="button"
                onClick={() => toggleField(field.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#1A1A1A] bg-[#FAF8F5] ring-2 ring-[#FFD3AC]'
                    : 'border-[#E7E2D9] hover:border-[#C8996A] bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{field.icon}</div>
                <div className="font-medium text-sm text-[#1A1A1A]">{field.label}</div>
              </button>
            );
          })}
        </div>
        <button
          type="submit"
          disabled={updating}
          className={`w-full py-3 rounded-lg font-semibold shadow transition ${
            updating
              ? 'bg-[#8C827A] text-white cursor-not-allowed'
              : 'bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white'
          }`}
        >
          {updating ? 'Updating…' : 'Update'}
        </button>
      </form>
    </div>
  );
}
