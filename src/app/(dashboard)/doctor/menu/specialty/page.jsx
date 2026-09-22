'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import AmbeButton from '@/components/common/AmbeButton';
import AmbeTextField from '@/components/common/AmbeTextField';

// 11 official health fields matching mobile app
const HEALTH_FIELDS = [
  { value: 'general_health', label: 'General Health' },
  { value: 'womens_health', label: "Women's Health" },
  { value: 'mens_health', label: "Men's Health" },
  { value: 'muscular_skeletal', label: 'Muscular Skeletal' },
  { value: 'heart_health', label: 'Heart Health' },
  { value: 'skin_hair_health', label: 'Skin & Hair Health' },
  { value: 'mental_emotional_health', label: 'Mental Emotional Health' },
  { value: 'digestive_metabolic', label: 'Digestive & Metabolic' },
  { value: 'oncology', label: 'Oncology' },
  { value: 'disabilities', label: 'Disabilities' },
  { value: 'behavorial', label: 'Behavorial' },
];

export default function DoctorSpecialtyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);
  const [showCustomField, setShowCustomField] = useState(false);
  const [customSpecialization, setCustomSpecialization] = useState('');
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
          const data = snap.data() || {};
          const fields = Array.isArray(data.field)
            ? data.field
            : (Array.isArray(data.doctor_fields) ? data.doctor_fields : []);
          setSelectedFields(fields);
          if (data.custom_specialization || data.customSpecialization) {
            setShowCustomField(true);
            setCustomSpecialization(data.custom_specialization || data.customSpecialization || '');
          }
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

  const toggleCustomField = () => {
    setShowCustomField((prev) => {
      const next = !prev;
      if (!next) {
        setCustomSpecialization('');
      }
      return next;
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedFields.length === 0 && (!showCustomField || !customSpecialization.trim())) {
      setError('Please select at least one specialty');
      return;
    }
    if (showCustomField && !customSpecialization.trim()) {
      setError('Please specify your other specialization');
      return;
    }

    setUpdating(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user');

      const keys = [...selectedFields];
      let customSpec = null;
      if (showCustomField && customSpecialization.trim()) {
        if (!keys.includes('general_health')) {
          keys.push('general_health');
        }
        customSpec = customSpecialization.trim();
      }

      await updateDoc(doc(db, 'doctors', user.uid), {
        field: keys,
        doctor_fields: keys,
        custom_specialization: customSpec,
      });

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          field: keys,
          doctor_fields: keys,
          customSpecialization: customSpec,
        });
      } catch (_) {}

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
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-heading font-bold flex-1">
          Specialty
        </h1>
      </div>

      {/* Sub-header matching App */}
      <div>
        <h2 className="text-white text-xl sm:text-2xl font-semibold font-sans mb-1.5">
          Select Your Specialties
        </h2>
        <p className="text-sm text-gray-400 font-sans">
          Choose all areas of practice that apply to you
        </p>
      </div>

      {error && (
        <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
          <p className="text-xs text-red-300 font-sans">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2.5">
          {HEALTH_FIELDS.map((field) => {
            const isSelected = selectedFields.includes(field.value);
            return (
              <button
                key={field.value}
                type="button"
                onClick={() => toggleField(field.value)}
                className={`w-full p-4 px-5 rounded-2xl text-left transition-all duration-150 cursor-pointer border flex items-center justify-between shadow-sm ${
                  isSelected
                    ? 'border-[#FFD3AC] bg-[#FFD3AC] text-[#1E1E1E] font-semibold'
                    : 'border-gray-200 bg-white text-[#1E1E1E] font-medium hover:bg-gray-50'
                }`}
              >
                <span className="text-[16px] font-sans">{field.label}</span>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ml-3 transition-colors ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'border-2 border-gray-400 bg-white'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}

          {/* Other (Please Specify) Option */}
          <button
            type="button"
            onClick={toggleCustomField}
            className={`w-full p-4 px-5 rounded-2xl text-left transition-all duration-150 cursor-pointer border flex items-center justify-between shadow-sm ${
              showCustomField
                ? 'border-[#FFD3AC] bg-[#FFD3AC] text-[#1E1E1E] font-semibold'
                : 'border-gray-200 bg-white text-[#1E1E1E] font-medium hover:bg-gray-50'
            }`}
          >
            <span className="text-[16px] font-sans">Other (Please specify)</span>
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ml-3 transition-colors ${
                showCustomField
                  ? 'bg-black text-white'
                  : 'border-2 border-gray-400 bg-white'
              }`}
            >
              {showCustomField && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
          </button>
        </div>

        {showCustomField && (
          <div className="pt-1">
            <AmbeTextField
              placeholder="Enter your specialization"
              value={customSpecialization}
              onChange={(e) => setCustomSpecialization(e.target.value)}
              leadingIcon={
                <svg className="w-5 h-5 text-[#FFD3AC]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                </svg>
              }
            />
          </div>
        )}

        <div className="pt-4 flex justify-center">
          <AmbeButton
            type="submit"
            loading={updating}
            className="w-full py-4 text-base sm:text-lg font-bold shadow-md tracking-wider"
          >
            SAVE
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
