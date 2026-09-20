'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import AmbeButton from '@/components/common/AmbeButton';
import {
  IdentificationIcon,
  AcademicCapIcon,
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

      const parsedYears = parseInt(yearsOfExperience, 10);

      const docRef = doc(db, 'doctors', user.uid);
      await setDoc(
        docRef,
        {
          professional_title: professionalTitle.trim(),
          bio: bio.trim(),
          education: education.trim(),
          years_of_experience: !isNaN(parsedYears) ? parsedYears : 0,
          certifications: certifications.trim(),
          languages: languagesList,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save professional profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-bold font-sans flex-1">
          Professional Profile
        </h1>
      </div>

      <p className="text-sm text-gray-400 font-sans px-1">
        Detailed profiles build trust and help patients choose the right healthcare provider.
      </p>

      {error && (
        <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center">
          <p className="text-xs text-red-300 font-sans">{error}</p>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-2xl p-3 text-center flex items-center justify-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-300 font-sans">Professional profile updated successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Information Card */}
        <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-base font-semibold text-white font-sans flex items-center gap-2">
            <IdentificationIcon className="h-5 w-5 text-[#FFD3AC]" />
            Basic Information
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-sans">
              Professional Title <span className="text-[#FFD3AC]">*</span>
            </label>
            <input
              type="text"
              value={professionalTitle}
              onChange={(e) => setProfessionalTitle(e.target.value)}
              placeholder="e.g., MD, DO, PhD, RN, BAMS"
              className="w-full px-4 py-2.5 bg-[#2D2D30] border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-sans">
              Professional Bio
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell patients about your medical background, approach to care, and philosophy..."
              className="w-full px-4 py-3 bg-[#2D2D30] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] font-sans"
            />
          </div>
        </div>

        {/* Education & Experience Card */}
        <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-base font-semibold text-white font-sans flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-[#FFD3AC]" />
            Education & Experience
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-sans">
              Education & Medical School <span className="text-[#FFD3AC]">*</span>
            </label>
            <input
              type="text"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="e.g., Harvard Medical School, Johns Hopkins University"
              className="w-full px-4 py-2.5 bg-[#2D2D30] border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-sans">
              Years of Experience
            </label>
            <input
              type="number"
              min="0"
              max="70"
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              placeholder="e.g., 8"
              className="w-full px-4 py-2.5 bg-[#2D2D30] border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-sans">
              Certifications & Fellowships
            </label>
            <input
              type="text"
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              placeholder="e.g., Board Certified in Internal Medicine, FACOG"
              className="w-full px-4 py-2.5 bg-[#2D2D30] border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] font-sans"
            />
          </div>
        </div>

        {/* Additional Details Card */}
        <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <h2 className="text-base font-semibold text-white font-sans flex items-center gap-2">
            <LanguageIcon className="h-5 w-5 text-[#FFD3AC]" />
            Languages
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5 px-1 font-sans">
              Languages Spoken <span className="font-normal text-xs text-gray-500 lowercase">(comma separated)</span>
            </label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="e.g., English, Spanish, Hindi"
              className="w-full px-4 py-2.5 bg-[#2D2D30] border border-white/10 rounded-full text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FFD3AC] font-sans"
            />
          </div>
        </div>

        {/* Info Tip */}
        <div className="p-4 bg-[#2D2D30]/80 border border-white/10 rounded-2xl flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-[#FFD3AC] shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            Your professional profile details will be visible to patients browsing the practitioner directory and scheduling consultations.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-center">
          <AmbeButton type="submit" loading={saving} className="w-full">
            SAVE PROFILE
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
