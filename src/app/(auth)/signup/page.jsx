"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { auth, functions, db } from '@/lib/firebase/config';
import { sendEmailVerification, updateProfile } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import PhoneInputWithCountry from '@/components/common/PhoneInputWithCountry';
import Link from 'next/link';
import AmbeButton from '@/components/common/AmbeButton';
import AmbeTextField from '@/components/common/AmbeTextField';
import AmbeBackButton from '@/components/common/AmbeBackButton';

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    userType: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    genderAtBirth: '',
    specializations: [],
    customSpecialization: '',
    practiceStartYear: '',
    medicalSchool: '',
    professionalTitles: [],
    customProfessionalTitle: '',
    referralCode: '',
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

  const getDateOfBirth = () => {
    const { dobDay, dobMonth, dobYear } = formData;
    if (!dobDay || !dobMonth || !dobYear) return null;
    const month = String(months.indexOf(dobMonth) + 1).padStart(2, '0');
    return `${dobYear}-${month}-${dobDay}`;
  };

  // Validation errors
  const [errors, setErrors] = useState({});

  // Doctor documents
  const [documents, setDocuments] = useState({
    license: null,
    id: null,
    certifications: null,
  });

  const specializations = [
    { value: 'primary_care', label: 'Primary Care' },
    { value: 'mental_health', label: 'Mental Health' },
    { value: 'womens_health', label: "Women's Health" },
    { value: 'mens_health', label: "Men's Health" },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'chronic_conditions', label: 'Chronic Conditions' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'fitness', label: 'Fitness' },
    { value: 'yoga_meditation', label: 'Yoga & Meditation' },
    { value: 'general_health', label: 'Other (Please Specify)' },
  ];

  const PROFESSIONAL_TITLES = ['MD', 'DO', 'NPR', 'BAMS', 'Other'];
  const currentYear = new Date().getFullYear();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const errorKey = field.startsWith('dob') ? 'dateOfBirth' : field;
    setErrors(prev => ({ ...prev, [errorKey]: '' }));
  };

  const toggleSpecialization = (value) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(value)
        ? prev.specializations.filter(v => v !== value)
        : [...prev.specializations, value],
    }));
    setErrors(prev => ({ ...prev, specialization: '' }));
  };

  const toggleProfessionalTitle = (title) => {
    if (title === 'Other') {
      const isCurrentlySelected = formData.professionalTitles.includes('Other');
      setFormData(prev => ({
        ...prev,
        professionalTitles: isCurrentlySelected ? [] : ['Other'],
        customProfessionalTitle: isCurrentlySelected ? '' : prev.customProfessionalTitle,
      }));
    } else {
      setFormData(prev => {
        const withoutOther = prev.professionalTitles.filter(t => t !== 'Other');
        const isSelected = withoutOther.includes(title);
        return {
          ...prev,
          professionalTitles: isSelected
            ? withoutOther.filter(t => t !== title)
            : [...withoutOther, title],
          customProfessionalTitle: '',
        };
      });
    }
    setErrors(prev => ({ ...prev, professionalTitles: '', customProfessionalTitle: '' }));
  };

  const validateStep = () => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.userType) {
          newErrors.userType = 'Please select a role before continuing.';
        }
        break;

      case 2:
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Invalid email address';
        }
        break;

      case 3:
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
        break;

      case 4:
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 5:
        if (formData.userType === 'doctor') {
          if (!formData.practiceStartYear) {
            newErrors.practiceStartYear = 'Practice start year is required';
          } else {
            const year = Number(formData.practiceStartYear);
            if (Number.isNaN(year) || year < 1950 || year > currentYear) {
              newErrors.practiceStartYear = `Enter a valid year between 1950 and ${currentYear}`;
            }
          }
          if (!formData.medicalSchool.trim()) {
            newErrors.medicalSchool = 'Medical school is required';
          }
          if (formData.professionalTitles.length === 0) {
            newErrors.professionalTitles = 'Select at least one professional title';
          }
          if (
            formData.professionalTitles.includes('Other') &&
            !formData.customProfessionalTitle.trim()
          ) {
            newErrors.customProfessionalTitle = 'Specify your professional title';
          }
          if (formData.specializations.length === 0) {
            newErrors.specialization = 'Please select at least one area of focus';
          }
          if (
            formData.specializations.includes('general_health') &&
            !formData.customSpecialization.trim()
          ) {
            newErrors.customSpecialization = 'Please specify your other specialization';
          }
        }
        break;

      case 6:
        if (formData.userType === 'doctor') {
          if (!documents.license) {
            newErrors.license = 'Medical license is required';
          }
          if (!documents.id) {
            newErrors.id = 'Government ID is required';
          }
        }
        break;

      case 7:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getStepCount = () => {
    return formData.userType === 'doctor' ? 7 : 4;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 4 && formData.userType !== 'doctor') {
        handleSubmit();
      } else if (step === 7 && formData.userType === 'doctor') {
        handleSubmit();
      } else {
        setStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFileUpload = (type, file) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
    setErrors(prev => ({ ...prev, [type]: '' }));
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePhoto: 'Image must be under 5MB' }));
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, profilePhoto: '' }));
    }
  };

  const handleRemoveProfilePhoto = () => {
    setProfilePhoto(null);
    if (profilePhotoPreview) {
      URL.revokeObjectURL(profilePhotoPreview);
      setProfilePhotoPreview(null);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result || '';
        const base64 = String(result).split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const buildDocumentsPayload = async () => {
    const entries = [
      [documents.license, 'license'],
      [documents.id, 'government_id'],
      [documents.certifications, 'certification'],
    ];

    const docs = [];
    for (const [file, type] of entries) {
      if (!file) continue;
      const contentBase64 = await fileToBase64(file);
      docs.push({
        name: file.name,
        contentBase64,
        contentType: file.type || 'application/octet-stream',
        type,
      });
    }
    return docs;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      const isDoctor = formData.userType === 'doctor';
      const documentsPayload = isDoctor ? await buildDocumentsPayload() : [];

      const createUser = httpsCallable(functions, 'createUser');
      const result = await createUser({
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        phone_number: formData.phone,
        date_of_birth: getDateOfBirth(),
        gender_at_birth: formData.genderAtBirth || null,
        genderAtBirth: formData.genderAtBirth || null,
        referral_code: formData.referralCode ? formData.referralCode.trim().toUpperCase() : null,
        role: formData.userType,
        user_type: formData.userType,
        customSpecialization: formData.customSpecialization,
        ...(isDoctor
          ? {
              doctor_fields: formData.specializations,
              practice_start_year: formData.practiceStartYear
                ? Number(formData.practiceStartYear)
                : null,
              medical_school: formData.medicalSchool,
              professional_title: formData.professionalTitles.includes('Other')
                ? formData.customProfessionalTitle.trim()
                : formData.professionalTitles.join(', '),
              custom_professional_title: formData.professionalTitles.includes('Other')
                ? formData.customProfessionalTitle.trim()
                : null,
              documents: documentsPayload,
            }
          : {}),
      });

      if (result.data?.uid) {
        const userType = await signIn(formData.email, formData.password);

        if (profilePhoto) {
          try {
            const storage = getStorage();
            const picRef = storageRef(storage, `images/${result.data.uid}/profile_picture.png`);
            await uploadBytes(picRef, profilePhoto);
            const photoURL = await getDownloadURL(picRef);

            if (auth.currentUser) {
              await updateProfile(auth.currentUser, { photoURL });
            }

            const colName = isDoctor ? 'doctors' : 'users';
            await setDoc(
              doc(db, colName, result.data.uid),
              { profile_picture: photoURL },
              { merge: true }
            );
          } catch (photoErr) {
            console.warn("Profile photo upload warning:", photoErr);
          }
        }

        if (!isDoctor && formData.referralCode && formData.referralCode.trim()) {
          try {
            const enteredCode = formData.referralCode.trim().toUpperCase();
            const referrerQuery = query(
              collection(db, 'users'),
              where('referral_code', '==', enteredCode),
              limit(1)
            );
            const referrerSnap = await getDocs(referrerQuery);
            if (!referrerSnap.empty) {
              const referrerDoc = referrerSnap.docs[0];
              await setDoc(
                doc(db, 'users', result.data.uid),
                {
                  referred_by: referrerDoc.id,
                  referral_status: 'pending',
                  has_made_purchase: false,
                  referral_code_used: enteredCode,
                  referral_credits: 0,
                },
                { merge: true }
              );
            }
          } catch (refErr) {
            console.warn("Referral warning:", refErr);
          }
        }

        try {
          if (auth.currentUser) {
            const roleParam = userType || formData.userType;
            const continueUrl =
              typeof window !== 'undefined'
                ? `${window.location.origin}/auth/continue?source=web&role=${roleParam}`
                : `https://ambewellness.com/auth/continue?source=web&role=${roleParam}`;
            await sendEmailVerification(auth.currentUser, {
              url: continueUrl,
              handleCodeInApp: false,
            });
          }
        } catch (verifyErr) {
          console.warn("Email verification error:", verifyErr);
        }

        router.push(`/verify-email?email=${encodeURIComponent(formData.email.trim())}&role=${userType || formData.userType}`);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Flutter StepChooseProfileType
        return (
          <div className="py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-8 font-sans">
              Who are you signing up as?
            </h2>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
              {/* Patient Card */}
              <div
                onClick={() => updateFormData("userType", "user")}
                className={`
                  h-36 sm:h-40 rounded-[20px] p-3 sm:p-4 flex flex-col items-center justify-center
                  cursor-pointer transition-all duration-200 select-none shadow-md
                  ${
                    formData.userType === "user"
                      ? "bg-[#FFD3AC] text-black ring-2 ring-[#FFD3AC]"
                      : "bg-white text-black hover:bg-gray-50"
                  }
                `}
              >
                <div
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3
                    ${formData.userType === "user" ? "bg-black/80 text-[#FFD3AC]" : "bg-black text-white"}
                  `}
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm sm:text-base font-sans tracking-tight">
                  I&apos;m a Patient
                </span>
              </div>

              {/* Doctor Card */}
              <div
                onClick={() => updateFormData("userType", "doctor")}
                className={`
                  h-36 sm:h-40 rounded-[20px] p-3 sm:p-4 flex flex-col items-center justify-center
                  cursor-pointer transition-all duration-200 select-none shadow-md
                  ${
                    formData.userType === "doctor"
                      ? "bg-[#FFD3AC] text-black ring-2 ring-[#FFD3AC]"
                      : "bg-white text-black hover:bg-gray-50"
                  }
                `}
              >
                <div
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3
                    ${formData.userType === "doctor" ? "bg-black/80 text-[#FFD3AC]" : "bg-black text-white"}
                  `}
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-2h4v2h-4V4zm8 16H4V8h16v12zm-9-2h2v-3h3v-2h-3V9h-2v3H8v2h3z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm sm:text-base font-sans tracking-tight">
                  I&apos;m a Doctor
                </span>
              </div>
            </div>

            {errors.userType && (
              <p className="text-red-400 text-sm text-center font-sans mb-4">
                {errors.userType}
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-6 font-sans">
              Personal Information
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <AmbeTextField
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                error={errors.firstName}
                required
              />
              <AmbeTextField
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                error={errors.lastName}
                required
              />
            </div>

            <AmbeTextField
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
              leadingIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              }
            />

            {/* Optional DOB & Sex Assigned at Birth */}
            <div className="pt-2">
              <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                Date of Birth (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={formData.dobMonth}
                  onChange={(e) => updateFormData("dobMonth", e.target.value)}
                  className="bg-white text-[#1E1E1E] text-xs font-sans rounded-full px-3 py-3 outline-none border border-transparent focus:border-[#FFD3AC]"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={formData.dobDay}
                  onChange={(e) => updateFormData("dobDay", e.target.value)}
                  className="bg-white text-[#1E1E1E] text-xs font-sans rounded-full px-3 py-3 outline-none border border-transparent focus:border-[#FFD3AC]"
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  value={formData.dobYear}
                  onChange={(e) => updateFormData("dobYear", e.target.value)}
                  className="bg-white text-[#1E1E1E] text-xs font-sans rounded-full px-3 py-3 outline-none border border-transparent focus:border-[#FFD3AC]"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-1">
              <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                Sex Assigned at Birth (Optional)
              </label>
              <div className="relative">
                <select
                  value={formData.genderAtBirth}
                  onChange={(e) => updateFormData("genderAtBirth", e.target.value)}
                  className="w-full bg-white text-[#1E1E1E] text-xs sm:text-sm font-sans rounded-full pl-4 pr-10 py-3.5 outline-none border border-transparent focus:border-[#FFD3AC] cursor-pointer appearance-none shadow-sm"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1E1E1E]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Referral Code - matches Flutter StepPersonalInfoUser placement */}
            {formData.userType !== "doctor" && (
              <div className="pt-2">
                <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-1.5">
                  Referral Code (Optional)
                </label>
                <AmbeTextField
                  placeholder="Enter referral code"
                  value={formData.referralCode}
                  onChange={(e) => updateFormData("referralCode", e.target.value.toUpperCase())}
                  leadingIcon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 .5c1.38 0 2.5 1.12 2.5 2.5S13.38 11.5 12 11.5 9.5 10.38 9.5 9 10.62 6.5 12 6.5zM19 19H5v-1c0-2.33 4.33-3.5 7-3.5s7 1.17 7 3.5v1z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-6 font-sans">
              Phone Number
            </h2>
            <div className="bg-white rounded-[26px] p-2">
              <PhoneInputWithCountry
                value={formData.phone}
                onChange={(phone) => updateFormData("phone", phone)}
                error={errors.phone}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-400 px-3">{errors.phone}</p>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-6 font-sans">
              Set Your Password
            </h2>

            <AmbeTextField
              type="password"
              placeholder="Password (min 8 characters)"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              error={errors.password}
              showPasswordToggle
              required
              leadingIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              }
            />

            <AmbeTextField
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => updateFormData("confirmPassword", e.target.value)}
              error={errors.confirmPassword}
              showPasswordToggle
              required
              leadingIcon={
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              }
            />
          </div>
        );

      case 5:
        // Doctor career & specializations
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-4 font-sans">
              Career &amp; Specialty
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <AmbeTextField
                placeholder="Practice Start Year (e.g. 2015)"
                value={formData.practiceStartYear}
                onChange={(e) => updateFormData("practiceStartYear", e.target.value)}
                error={errors.practiceStartYear}
              />
              <AmbeTextField
                placeholder="Medical School"
                value={formData.medicalSchool}
                onChange={(e) => updateFormData("medicalSchool", e.target.value)}
                error={errors.medicalSchool}
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                Professional Titles
              </label>
              <div className="flex flex-wrap gap-2">
                {PROFESSIONAL_TITLES.map((t) => {
                  const sel = formData.professionalTitles.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleProfessionalTitle(t)}
                      className={`
                        px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer
                        ${sel ? "bg-[#FFD3AC] text-[#1E1E1E]" : "bg-white/10 text-white hover:bg-white/20"}
                      `}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
              {errors.professionalTitles && (
                <p className="text-xs text-red-400 mt-1">{errors.professionalTitles}</p>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2">
                Clinical Focus Areas
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {specializations.map(({ value, label }) => {
                  const sel = formData.specializations.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleSpecialization(value)}
                      className={`
                        p-2.5 text-left rounded-xl text-xs font-medium transition cursor-pointer
                        ${sel ? "bg-[#FFD3AC] text-[#1E1E1E] font-bold" : "bg-white/10 text-white hover:bg-white/20"}
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {errors.specialization && (
                <p className="text-xs text-red-400 mt-1">{errors.specialization}</p>
              )}
            </div>
          </div>
        );

      case 6:
        // Doctor documents
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-4 font-sans">
              Verification Documents
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <label className="block text-xs uppercase font-semibold text-[#FFD3AC] mb-1">
                  Medical License *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload("license", e.target.files?.[0])}
                  className="w-full text-xs text-gray-300"
                />
                {documents.license && (
                  <p className="text-xs text-emerald-400 mt-1">✓ {documents.license.name}</p>
                )}
                {errors.license && (
                  <p className="text-xs text-red-400 mt-1">{errors.license}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <label className="block text-xs uppercase font-semibold text-[#FFD3AC] mb-1">
                  Government ID *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload("id", e.target.files?.[0])}
                  className="w-full text-xs text-gray-300"
                />
                {documents.id && (
                  <p className="text-xs text-emerald-400 mt-1">✓ {documents.id.name}</p>
                )}
                {errors.id && (
                  <p className="text-xs text-red-400 mt-1">{errors.id}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/15">
                <label className="block text-xs uppercase font-semibold text-[#FFD3AC] mb-1">
                  Board Certifications (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload("certifications", e.target.files?.[0])}
                  className="w-full text-xs text-gray-300"
                />
                {documents.certifications && (
                  <p className="text-xs text-emerald-400 mt-1">✓ {documents.certifications.name}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 7:
        // Doctor photo
        return (
          <div className="text-center py-2">
            <h2 className="text-white text-xl font-semibold mb-2 font-sans">
              Profile Picture
            </h2>
            <p className="text-gray-400 text-xs mb-6">
              Add a professional photo so patients can recognize you.
            </p>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-32 h-32 rounded-full border-2 border-[#FFD3AC] bg-white/10 flex items-center justify-center overflow-hidden">
                {profilePhotoPreview ? (
                  <img
                    src={profilePhotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>

              <label className="px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FFD3AC] text-[#1E1E1E] cursor-pointer hover:bg-white transition shadow-sm">
                {profilePhotoPreview ? "Change Photo" : "Choose Photo"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </label>

              {profilePhotoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePhoto}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full flex flex-col justify-between px-2 sm:px-4">
      {/* Top Bar matching Flutter RegistrationScaffold */}
      <div>
        <div className="flex items-center gap-4 pt-2 pb-4">
          <AmbeBackButton onClick={step > 1 ? handleBack : () => router.push("/login")} />
          <h1 className="text-white text-lg sm:text-xl font-semibold tracking-wide font-sans flex-1">
            Register your profile ({step}/{getStepCount()})
          </h1>
        </div>

        {/* Peach Progress Bar */}
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-[#FFD3AC] rounded-full transition-all duration-300"
            style={{ width: `${(step / getStepCount()) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        {error && (
          <div className="bg-red-950/70 border border-red-500/50 rounded-2xl p-3 text-center mb-4">
            <p className="text-xs text-red-300 font-sans">{error}</p>
          </div>
        )}

        {renderStep()}

        {/* Bottom Button matching Flutter AmbeButton */}
        <div className="pt-6 flex justify-center">
          <AmbeButton
            onClick={handleNext}
            loading={loading}
            className="w-full sm:w-[260px]"
          >
            {step === getStepCount() ? (loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT") : "NEXT"}
          </AmbeButton>
        </div>
      </div>

      {/* Already have account */}
      <div className="text-center pt-6 pb-2">
        <p className="text-sm font-sans text-gray-200">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#FFD3AC] font-semibold hover:underline underline-offset-4 ml-1 inline-block"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
