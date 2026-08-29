'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
import {
  IdentificationIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  LanguageIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function DoctorProfessionalProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form fields matching mobile app doctor_professional_profile_page.dart
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('');

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
          setProfessionalTitle(data.professional_title || '');
          setBio(data.bio || '');

          // Education: use 'education', fallback to 'medical_school' from signup
          setEducation(data.education || data.medical_school || '');

          // Experience: use 'years_of_experience', fallback to calculated from 'practice_start_year'
          if (data.years_of_experience !== undefined && data.years_of_experience !== null) {
            setYearsOfExperience(String(data.years_of_experience));
          } else if (data.practice_start_year) {
            const startYear = parseInt(data.practice_start_year, 10);
            if (!isNaN(startYear)) {
              const currentYear = new Date().getFullYear();
              setYearsOfExperience(String(Math.max(0, currentYear - startYear)));
            }
          }

          setCertifications(data.certifications || '');

          if (Array.isArray(data.languages)) {
            setLanguages(data.languages.join(', '));
          } else if (typeof data.languages === 'string') {
            setLanguages(data.languages);
          }
        }
      } catch (e) {
        console.error('Failed to load professional profile:', e);
        setError('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!professionalTitle.trim()) {
      setError('Professional title is required (e.g., MD, DO, RN, BAMS)');
      return;
    }

    if (!education.trim()) {
      setError('Education is required');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const languagesList = languages
        .split(',')
        .map((lang) => lang.trim())
        .filter(Boolean);

      const yearsExp = yearsOfExperience.trim() !== '' ? parseInt(yearsOfExperience.trim(), 10) : null;

      await setDoc(
        doc(db, 'doctors', user.uid),
        {
          professional_title: professionalTitle.trim(),
          bio: bio.trim(),
          education: education.trim(),
          years_of_experience: isNaN(yearsExp) ? null : yearsExp,
          certifications: certifications.trim(),
          languages: languagesList,
          profile_updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      router.back();
    } catch (e) {
      console.error('Error saving professional profile:', e);
      setError('Failed to save profile. Please try again.');
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
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <BackButton href="/doctor/menu" label="Back to Menu" />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
          Professional Profile
        </h1>
        <p className="text-sm text-[#6B6862] mt-1">
          Detailed profiles build trust and help patients choose the right healthcare provider.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>Professional profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <IdentificationIcon className="h-5 w-5 text-[#C8996A]" />
            Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Professional Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={professionalTitle}
              onChange={(e) => setProfessionalTitle(e.target.value)}
              placeholder="e.g., MD, DO, PhD, RN, BAMS"
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Professional Bio
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell patients about your medical background, approach to care, and philosophy..."
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
            />
          </div>
        </div>

        {/* Education & Experience Card */}
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-[#C8996A]" />
            Education & Experience
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Education & Medical School <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g., Harvard Medical School, Johns Hopkins University"
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="70"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="e.g., 8"
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Certifications & Fellowships
            </label>
            <input
              type="text"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="e.g., Board Certified in Internal Medicine, FACOG"
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
            />
          </div>
        </div>

        {/* Additional Details Card */}
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
            <LanguageIcon className="h-5 w-5 text-[#C8996A]" />
            Languages
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] mb-1.5">
              Languages Spoken <span className="font-normal text-xs text-[#8C827A] lowercase">(comma separated)</span>
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g., English, Spanish, Hindi"
              className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl text-sm text-[#1A1A1A] placeholder-[#8C827A] focus:outline-none focus:border-[#C8996A]"
            />
          </div>
        </div>

        {/* Info Tip */}
        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-[#C2691C] shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B6862] leading-relaxed">
            Your professional profile details will be visible to patients browsing the practitioner directory and scheduling consultations.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs shadow transition bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1A1A1A] border-t-transparent" />
              Saving Profile...
            </>
          ) : (
            'Save Profile'
          )}
        </button>
      </form>
    </div>
  );
}
