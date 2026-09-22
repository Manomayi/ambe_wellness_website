'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import AmbeButton from '@/components/common/AmbeButton';
import {
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

      // Also sync with users document
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            professional_title: professionalTitle.trim(),
            bio: bio.trim(),
            education: education.trim(),
          },
          { merge: true }
        );
      } catch (_) {}

      setSavedSuccess(true);
      setTimeout(() => {
        router.back();
      }, 700);
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
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Top Bar matching app */}
      <div className="flex items-center gap-4 pt-1">
        <AmbeBackButton onClick={() => router.back()} />
        <h1 className="text-white text-xl font-heading font-bold flex-1">
          Professional Profile
        </h1>
      </div>

      {/* Header section matching app */}
      <div>
        <h2 className="text-white text-2xl sm:text-3xl font-bold font-sans tracking-tight">
          Boost Your Presence
        </h2>
        <p className="text-sm text-gray-400 font-sans mt-1.5 leading-relaxed">
          Detailed profiles attract more patients. Fill in your professional details to stand out.
        </p>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-[#1E1E1E]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-white font-sans">
            Basic Information
          </h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 px-1 font-sans">
              Professional Title
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-[#FFD3AC]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.364a4.125 4.125 0 00-6.338 0 .375.375 0 01-.266.111h6.87c-.098 0-.193-.04-.266-.111z" />
                </svg>
              </div>
              <input
                type="text"
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                placeholder="e.g., MD, DO, PhD, RN, BAMS"
                className="w-full pl-12 pr-4 py-3 bg-[#2A2A2E] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD3AC] font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 px-1 font-sans">
              Professional Bio
            </label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 pointer-events-none text-[#FFD3AC]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell patients about your medical background, approach to care, and philosophy..."
                className="w-full pl-12 pr-4 py-3 bg-[#2A2A2E] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD3AC] font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Education & Experience Card */}
        <div className="bg-[#1E1E1E]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-white font-sans">
            Education & Experience
          </h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 px-1 font-sans">
              Education
            </label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 pointer-events-none text-[#FFD3AC]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                </svg>
              </div>
              <textarea
                rows={2}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g., Harvard Medical School, Johns Hopkins University"
                className="w-full pl-12 pr-4 py-3 bg-[#2A2A2E] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD3AC] font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 px-1 font-sans">
              Experience (Years)
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-[#FFD3AC]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v1.069m7.5 0c1.35.086 2.68.23 3.987.426M7.5 6.319c-1.35.086-2.68.23-3.987.426m0 0a48.513 48.513 0 00-1.662.29M18.75 6.609a48.513 48.513 0 011.662.29" />
                </svg>
              </div>
              <input
                type="number"
                min="0"
                max="70"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                placeholder="e.g., 5"
                className="w-full pl-12 pr-4 py-3 bg-[#2A2A2E] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD3AC] font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 px-1 font-sans">
              Certifications
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-[#FFD3AC]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <input
                type="text"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                placeholder="e.g., Board Certified in Internal Medicine, FACOG"
                className="w-full pl-12 pr-4 py-3 bg-[#2A2A2E] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD3AC] font-sans"
              />
            </div>
          </div>
        </div>

        {/* Additional Details Card */}
        <div className="bg-[#1E1E1E]/80 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-white font-sans">
            Additional Details
          </h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 px-1 font-sans">
              Languages
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-4 pointer-events-none text-[#FFD3AC]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                </svg>
              </div>
              <input
                type="text"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="e.g., English, Spanish (comma separated)"
                className="w-full pl-12 pr-4 py-3 bg-[#2A2A2E] border border-white/10 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD3AC] font-sans"
              />
            </div>
          </div>
        </div>

        {/* Info Tip matching Flutter */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/25 rounded-2xl flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-100/80 leading-relaxed font-sans">
            A complete professional profile helps patients make informed decisions and increases your chances of being matched.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-center">
          <AmbeButton
            type="submit"
            loading={saving}
            className="w-full py-4 text-base sm:text-lg font-bold shadow-md tracking-wider"
          >
            {saving ? 'SAVING...' : 'SAVE PROFILE'}
          </AmbeButton>
        </div>
      </form>
    </div>
  );
}
