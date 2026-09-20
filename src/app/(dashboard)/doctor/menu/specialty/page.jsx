'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import AmbeButton from '@/components/common/AmbeButton';

// Same set of health fields used by the patient-facing GetMatched flow
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
      setError('Update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-bold font-sans flex-1">
          Specialty
        </h1>
      </div>

      <p className="text-sm text-gray-400 font-sans px-1">
        Select all health fields you practice in. Patients are matched to you based on these.
      </p>

      {error && (
        <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
          <p className="text-xs text-red-300 font-sans">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HEALTH_FIELDS.map((field) => {
            const isSelected = selectedFields.includes(field.value);
            return (
              <button
                key={field.value}
                type="button"
                onClick={() => toggleField(field.value)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FFD3AC] bg-[#FFD3AC] text-[#1E1E1E] shadow-md'
                    : 'border-white/10 hover:border-white/20 bg-[#1B1A18]/80 text-white'
                }`}
              >
                <div className="text-2xl mb-1">{field.icon}</div>
                <div className="font-semibold text-sm font-sans">{field.label}</div>
              </button>
            );
          })}
        </div>

        <div className="pt-2 flex justify-center">
          <AmbeButton type="submit" loading={updating} className="w-full">
            SAVE SPECIALTIES
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
