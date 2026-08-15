'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
import {
  UserPlusIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const HEALTH_SPECIALTIES = [
  'General Health',
  "Women's Health",
  "Men's Health",
  'Muscular Skeletal',
  'Heart Health',
  'Skin & Hair Health',
  'Mental Emotional Health',
  'Digestive & Metabolic',
  'Oncology',
  'Disabilities',
  'Behavorial',
];

export default function RequestDoctorPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Status/Blocker checks
  const [blockerState, setBlockerState] = useState(null); // 'no_doctor' | 'not_eligible' | 'has_upcoming' | 'already_pending'
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [referredDoctor, setReferredDoctor] = useState(null);

  // Form inputs
  const [reason, setReason] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login');
        return;
      }
      setUser(u);
      await checkEligibilityAndLoad(u.uid);
    });
    return () => unsub();
  }, [router]);

  const checkEligibilityAndLoad = async (uid) => {
    setLoading(true);
    try {
      // 1. Fetch user doc
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }
      const uData = userSnap.data();
      setUserData(uData);

      // Check if doctor is assigned
      const doctorMap = uData.doctor;
      if (!doctorMap || !doctorMap.uid) {
        setBlockerState('no_doctor');
        setLoading(false);
        return;
      }

      // Check if first consultation is completed
      const isFirstConsultCompleted = uData.is_first_consultation_completed ?? false;
      if (!isFirstConsultCompleted) {
        setBlockerState('not_eligible');
        setLoading(false);
        return;
      }

      // 2. Check for upcoming appointments
      const upcomingSnap = await getDocs(
        query(
          collection(db, 'users', uid, 'appointments_upcoming'),
          limit(1)
        )
      );
      if (!upcomingSnap.empty) {
        setBlockerState('has_upcoming');
        setLoading(false);
        return;
      }

      // 3. Check for pending doctor change requests
      const pendingSnap = await getDocs(
        query(
          collection(db, 'doctor_change_requests'),
          where('userId', '==', uid),
          where('status', '==', 'pending'),
          limit(1)
        )
      );
      if (!pendingSnap.empty) {
        setBlockerState('already_pending');
        setLoading(false);
        return;
      }

      // 4. Resolve Doctor Name
      let docName = doctorMap.name || 'Unknown';
      if (docName === 'Unknown' || !docName) {
        try {
          const docSnap = await getDoc(doc(db, 'doctors', doctorMap.uid));
          if (docSnap.exists()) {
            const d = docSnap.data();
            docName = `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim();
          }
        } catch (e) {
          console.warn('Error fetching doctor name:', e);
        }
      }
      setCurrentDoctor({ uid: doctorMap.uid, name: docName });

      // 5. Check for any referrals by previous doctor
      try {
        const refSnap = await getDocs(
          query(
            collection(db, 'referrals'),
            where('patient_uid', '==', uid),
            orderBy('created_at', 'desc'),
            limit(1)
          )
        );
        if (!refSnap.empty) {
          const rData = refSnap.docs[0].data();
          if (rData.referred_to_doctor_name) {
            setReferredDoctor(rData.referred_to_doctor_name);
          }
          if (rData.referred_specialty_label) {
            setSelectedSpecialty(rData.referred_specialty_label);
          }
        }
      } catch (rErr) {
        console.warn('Error checking referrals:', rErr);
      }

      setBlockerState(null);
    } catch (err) {
      console.error('Error checking eligibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!reason.trim()) {
      setFormError('Please provide a reason for your request.');
      return;
    }
    if (!selectedSpecialty) {
      setFormError('Please select a preferred specialty.');
      return;
    }

    setSubmitting(true);

    try {
      const u = auth.currentUser;
      if (!u) throw new Error('No user logged in');

      const userName = userData?.first_name
        ? `${userData.first_name} ${userData.last_name || ''}`.trim()
        : u.displayName || 'Unknown';

      await addDoc(collection(db, 'doctor_change_requests'), {
        userId: u.uid,
        userName: userName,
        userEmail: u.email || 'Unknown',
        currentDoctorId: currentDoctor?.uid || '',
        currentDoctorName: currentDoctor?.name || 'Unknown',
        reason: reason.trim(),
        preferredSpecialty: selectedSpecialty,
        referredDoctor: referredDoctor || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setSubmittedSuccess(true);
    } catch (err) {
      console.error('Error submitting change request:', err);
      setFormError('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-2 border-[#C8996A] border-t-transparent rounded-full" />
      </div>
    );
  }

  // 1. Blocker: No doctor assigned
  if (blockerState === 'no_doctor') {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <BackButton />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-center mx-auto text-[#C8996A]">
            <UserPlusIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">No Doctor Assigned</h2>
          <p className="text-sm text-[#6B6862] max-w-md mx-auto">
            You do not currently have a doctor assigned. You can select your health preferences and match with a healthcare provider now.
          </p>
          <button
            onClick={() => router.push('/user/get-matched')}
            className="mt-2 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition"
          >
            Match With a Doctor
          </button>
        </div>
      </div>
    );
  }

  // 2. Blocker: First consult not completed
  if (blockerState === 'not_eligible') {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <BackButton />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-center mx-auto text-[#C8996A]">
            <ExclamationCircleIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Eligibility Requirement</h2>
          <p className="text-sm text-[#6B6862] max-w-md mx-auto leading-relaxed">
            You can request a new doctor after you have completed your first consultation with your currently assigned practitioner.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/user/consult')}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition"
            >
              Go to Consultations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Blocker: Has upcoming appointment
  if (blockerState === 'has_upcoming') {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <BackButton />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <CalendarDaysIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Upcoming Appointment Scheduled</h2>
          <p className="text-sm text-[#6B6862] max-w-md mx-auto leading-relaxed">
            You cannot request a new doctor while you have scheduled appointments. Please complete or reschedule them first from your consult dashboard.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/user/consult')}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition"
            >
              View Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Blocker: Already pending request
  if (blockerState === 'already_pending') {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <BackButton />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
            <ClockIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Request Under Review</h2>
          <p className="text-sm text-[#6B6862] max-w-md mx-auto leading-relaxed">
            You already have a pending request to change your doctor. Our clinical coordination team is reviewing your request and will notify you soon.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/user/home')}
              className="bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Success state
  if (submittedSuccess) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <BackButton />
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-8 shadow-sm text-center space-y-4">
          <CheckCircleIcon className="h-16 w-16 text-emerald-600 mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Request Submitted
          </h2>
          <p className="text-sm text-[#6B6862] max-w-md mx-auto leading-relaxed">
            Thank you. Your request to change your healthcare provider has been submitted. Our team will review your preferred specialty and match you accordingly.
          </p>
          <button
            onClick={() => router.push('/user/home')}
            className="mt-4 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 6. Main Request Doctor Form
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton />

      <div className="bg-white border border-[#E7E2D9] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
            Request a New Doctor
          </h1>
          <p className="text-sm text-[#6B6862] mt-1">
            We want to make sure you receive the care that best fits your wellness journey.
          </p>
        </div>

        {/* Current Doctor Card */}
        {currentDoctor && (
          <div className="p-4 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8C827A]">
                Current Doctor
              </span>
              <p className="font-bold text-base text-[#1A1A1A] mt-0.5">
                {currentDoctor.name}
              </p>
            </div>
          </div>
        )}

        {/* Suggested by previous doctor banner if referral exists */}
        {referredDoctor && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <SparklesIcon className="h-4 w-4" />
              <span>Suggested by Previous Doctor</span>
            </div>
            <p className="font-bold text-sm text-[#1A1A1A]">{referredDoctor}</p>
            <p className="text-xs text-[#6B6862]">
              This doctor was recommended specifically for your care needs.
            </p>
          </div>
        )}

        {formError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">
              Reason for change
            </label>
            <textarea
              rows={4}
              required
              placeholder="Please tell us why you would like to change your doctor..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3.5 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C8996A] placeholder-[#8C827A] resize-none"
            />
          </div>

          {/* Preferred Specialty */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">
              Preferred Specialty
            </label>
            <select
              required
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#C8996A] cursor-pointer"
            >
              <option value="" disabled>
                Select Specialty
              </option>
              {HEALTH_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition disabled:opacity-50"
          >
            {submitting ? 'Submitting Request…' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
}
