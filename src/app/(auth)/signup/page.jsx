"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase/config';
import { sendEmailVerification } from 'firebase/auth';
import { ArrowRightIcon, ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    userType: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Date of birth is optional, captured as three parts like the mobile app's
    // sign-up flow and sent to createUser as a 'YYYY-MM-DD' string (or null).
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    // Sex assigned at birth. Only 'Male' narrows the extended questionnaire;
    // every other value — including blank — leaves all questions in place.
    genderAtBirth: '',
    specializations: [],
    customSpecialization: '',
    // Career information (doctor only) — mirrors the mobile app's
    // step_doctor_career_info.dart fields.
    practiceStartYear: '',
    medicalSchool: '',
    professionalTitles: [],
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const years = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

  // 'YYYY-MM-DD' once all three parts are chosen, otherwise null. Never
  // undefined: Firestore rejects undefined values, which fails createUser.
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

  const PROFESSIONAL_TITLES = ['MD', 'DO', 'NPR', 'BAMS'];
  const currentYear = new Date().getFullYear();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // The three date-of-birth selects share a single `dateOfBirth` error.
    const errorKey = field.startsWith('dob') ? 'dateOfBirth' : field;
    setErrors(prev => ({ ...prev, [errorKey]: '' }));
  };

  // Same toggle pattern as GetMatched.jsx's toggleField: add if absent,
  // remove if present.
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
    setFormData(prev => ({
      ...prev,
      professionalTitles: prev.professionalTitles.includes(title)
        ? prev.professionalTitles.filter(t => t !== title)
        : [...prev.professionalTitles, title],
    }));
    setErrors(prev => ({ ...prev, professionalTitles: '' }));
  };

  const validateStep = () => {
    const newErrors = {};

    switch (step) {
      case 1: // User type selection
        if (!formData.userType) {
          newErrors.userType = 'Please select user type';
        }
        break;

      case 2: // Basic info
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
          newErrors.email = 'Invalid email address';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        // Date of birth is optional, but a partial or impossible date (e.g.
        // February 31) must not reach createUser.
        {
          const parts = [formData.dobDay, formData.dobMonth, formData.dobYear];
          const filled = parts.filter(Boolean).length;
          if (filled > 0 && filled < 3) {
            newErrors.dateOfBirth = 'Please select month, day and year';
          } else if (filled === 3) {
            const monthIndex = months.indexOf(formData.dobMonth);
            const date = new Date(Number(formData.dobYear), monthIndex, Number(formData.dobDay));
            if (date.getDate() !== Number(formData.dobDay) || date.getMonth() !== monthIndex) {
              newErrors.dateOfBirth = 'Please select a valid date';
            } else if (date > new Date()) {
              newErrors.dateOfBirth = 'Date of birth cannot be in the future';
            }
          }
        }
        break;

      case 3: // Phone number
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
          newErrors.phone = 'Invalid phone number';
        }
        break;

      case 4: // Doctor specialization (multi-select)
        if (formData.userType === 'doctor') {
          if (formData.specializations.length === 0) {
            newErrors.specialization = 'Please select at least one specialization';
          }
          if (formData.specializations.includes('general_health') && !formData.customSpecialization.trim()) {
            newErrors.customSpecialization = 'Please specify your specialization';
          }
        }
        break;

      case 5: // Doctor career information
        if (formData.userType === 'doctor') {
          const yearText = formData.practiceStartYear.trim();
          if (!yearText) {
            newErrors.practiceStartYear = 'Please enter a year';
          } else if (!/^\d+$/.test(yearText)) {
            newErrors.practiceStartYear = 'Please enter a valid year';
          } else {
            const year = Number(yearText);
            if (year < 1950 || year > currentYear) {
              newErrors.practiceStartYear = `Please enter a year between 1950 and ${currentYear}`;
            }
          }
          if (!formData.medicalSchool.trim()) {
            newErrors.medicalSchool = 'Please enter your medical school';
          }
          if (formData.professionalTitles.length === 0) {
            newErrors.professionalTitles = 'Please select at least one professional title';
          }
        }
        break;

      case 6: // Doctor documents
        if (formData.userType === 'doctor') {
          if (!documents.license) {
            newErrors.license = 'Medical license is required';
          }
          if (!documents.id) {
            newErrors.id = 'Government ID is required';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFileUpload = (type, file) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
    setErrors(prev => ({ ...prev, [type]: '' }));
  };

  // Reads a File as base64 (stripping the `data:*/*;base64,` prefix) so it
  // can be sent inline in the createUser payload, matching the shape the
  // mobile app builds in step_confirmation.dart.
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

      // Documents must be part of the single createUser payload — the
      // backend (and the mobile app's step_confirmation.dart) uploads them
      // as part of account creation, not as a separate post-creation step.
      const documentsPayload = isDoctor ? await buildDocumentsPayload() : [];

      // The Auth account is created by the cloud function, not here — same
      // order as the mobile sign-up flow. Creating it client-side first left an
      // orphaned Auth user whenever the profile write failed, and every retry
      // then died on auth/email-already-in-use before reaching the function.
      const createUser = httpsCallable(functions, 'createUser');
      // createUser requires `password` and `role`; without them it rejects with
      // "Name and role are required" and no Firestore profile is ever written.
      // `user_type` is kept for backwards compatibility with anything still
      // reading it.
      const result = await createUser({
        // Trimmed to match signIn below, which trims before authenticating.
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        // The doctor branch of createUser reads `phone_number`; `phone` alone
        // would be dropped.
        phone_number: formData.phone,
        date_of_birth: getDateOfBirth(),
        gender_at_birth: formData.genderAtBirth || null,
        role: formData.userType,
        user_type: formData.userType,
        customSpecialization: formData.customSpecialization,
        // Doctor-only fields. Backend expects `doctor_fields` as an array —
        // the old scalar `specialization` field has been fully replaced.
        // `practice_start_year`, `medical_school`, and `professional_title`
        // match the shape the mobile app's step_confirmation.dart sends and
        // functions/index.js reads (professional_title is a single joined
        // string, not an array).
        ...(isDoctor
          ? {
              doctor_fields: formData.specializations,
              practice_start_year: formData.practiceStartYear
                ? Number(formData.practiceStartYear)
                : null,
              medical_school: formData.medicalSchool,
              professional_title: formData.professionalTitles.join(', '),
              documents: documentsPayload,
            }
          : {}),
      });

      // createUser resolves with { uid } — there is no `success` flag.
      if (result.data?.uid) {
        // Sign in with the credentials the function just registered, so the
        // user is authenticated.
        const userType = await signIn(formData.email, formData.password);

        // Send email verification
        try {
          if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
          }
        } catch (verifyErr) {
          console.warn("Initial email verification error (may be rate-limited):", verifyErr);
        }

        // Navigate to email verification step
        router.push(`/verify-email?email=${encodeURIComponent(formData.email.trim())}&role=${userType || formData.userType}`);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getStepCount = () => {
    return formData.userType === 'doctor' ? 6 : 3;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2
              className="text-2xl sm:text-3xl font-medium mb-6 text-center select-none"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
            >
              Join as a User or Doctor
            </h2>

            <div className="space-y-4">
              {[
                {
                  type: "user",
                  title: "I am a User",
                  desc: "Book consultations and manage your wellness journey",
                },
                {
                  type: "doctor",
                  title: "I am a Healthcare Provider",
                  desc: "Provide consultations and manage your practice",
                },
              ].map(({ type, title, desc }) => {
                const isSelected = formData.userType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateFormData("userType", type)}
                    className={`w-full p-5 text-left rounded-2xl border-2 transition-all cursor-pointer ${isSelected
                        ? "border-[#C2691C] bg-[#FFF8F2] shadow-sm"
                        : "border-[#E7E2D9] hover:border-[#C8996A] bg-white"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg" style={{ color: "#1A1A1A" }}>
                          {title}
                        </h3>
                        <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: "#6B6862" }}>
                          {desc}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${isSelected ? "border-[#C2691C]" : "border-[#D0D0D0]"
                          }`}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#C2691C]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.userType && (
              <p className="text-xs mt-3 text-center" style={{ color: "#C0392B" }}>
                {errors.userType}
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <h2
              className="text-2xl sm:text-3xl font-medium mb-6 text-center select-none"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
            >
              Create Your Account
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="given-name"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) => updateFormData("firstName", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                    style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="family-name"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) => updateFormData("lastName", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                    style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {formData.userType !== "doctor" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    Date of Birth <span className="font-normal lowercase" style={{ color: "#9A948B" }}>(optional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <select
                      value={formData.dobMonth}
                      onChange={(e) => updateFormData("dobMonth", e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                      style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    >
                      <option value="">Month</option>
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dobDay}
                      onChange={(e) => updateFormData("dobDay", e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                      style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    >
                      <option value="">Day</option>
                      {days.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dobYear}
                      onChange={(e) => updateFormData("dobYear", e.target.value)}
                      className="w-full px-3 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                      style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              )}

              {formData.userType !== "doctor" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    Sex at Birth <span className="font-normal lowercase" style={{ color: "#9A948B" }}>(optional)</span>
                  </label>
                  <select
                    value={formData.genderAtBirth}
                    onChange={(e) => updateFormData("genderAtBirth", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                    style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <p className="text-[11px] mt-1" style={{ color: "#9A948B" }}>
                    Used only to skip health questions that do not apply to you.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                  style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                  Password
                </label>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                  style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                  placeholder="At least 6 characters"
                />
                {errors.password && (
                  <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                  style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2
              className="text-2xl sm:text-3xl font-medium mb-2 text-center select-none"
              style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
            >
              Add Your Phone Number
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: "#6B6862" }}>
              We&apos;ll use this to send appointment reminders and important updates.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                Phone Number
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: "#9A948B" }} />
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                  style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {errors.phone && (
                <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                  {errors.phone}
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        if (formData.userType === "doctor") {
          return (
            <div>
              <h2
                className="text-2xl sm:text-3xl font-medium mb-6 text-center select-none"
                style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
              >
                Select Your Specialization
              </h2>
              <p className="text-sm text-center mb-4" style={{ color: "#6B6862" }}>
                Select all fields of practice that apply.
              </p>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {specializations.map((spec) => (
                  <button
                    key={spec.value}
                    type="button"
                    onClick={() => toggleSpecialization(spec.value)}
                    className={`w-full p-3.5 text-left rounded-xl border transition-all text-sm ${formData.specializations.includes(spec.value)
                        ? "border-[#C2691C] bg-[#FFF8F2] font-semibold text-[#1A1A1A]"
                        : "border-[#E7E2D9] hover:border-[#C8996A] bg-white text-[#353535]"
                      }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
              {errors.specialization && (
                <p className="text-xs mt-2 text-center" style={{ color: "#C0392B" }}>
                  {errors.specialization}
                </p>
              )}

              {formData.specializations.includes("general_health") && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    Please specify your specialization
                  </label>
                  <input
                    type="text"
                    value={formData.customSpecialization}
                    onChange={(e) => updateFormData("customSpecialization", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                    style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    placeholder="e.g., Dermatology, Cardiology, etc."
                  />
                  {errors.customSpecialization && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.customSpecialization}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        }
        break;

      case 5:
        if (formData.userType === "doctor") {
          return (
            <div>
              <h2
                className="text-2xl sm:text-3xl font-medium mb-6 text-center select-none"
                style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
              >
                Career Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    Year Practice Started
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={formData.practiceStartYear}
                    onChange={(e) => updateFormData("practiceStartYear", e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                    style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    placeholder="Enter year (e.g., 2010)"
                  />
                  {errors.practiceStartYear && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.practiceStartYear}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#1A1A1A" }}>
                    Medical School
                  </label>
                  <input
                    type="text"
                    value={formData.medicalSchool}
                    onChange={(e) => updateFormData("medicalSchool", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors bg-white focus:border-[#C2691C]"
                    style={{ borderColor: "#E7E2D9", color: "#1A1A1A" }}
                    placeholder="Enter your medical school"
                  />
                  {errors.medicalSchool && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.medicalSchool}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#1A1A1A" }}>
                    Professional Titles <span className="font-normal lowercase" style={{ color: "#9A948B" }}>(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PROFESSIONAL_TITLES.map((title) => {
                      const isSelected = formData.professionalTitles.includes(title);
                      return (
                        <button
                          key={title}
                          type="button"
                          onClick={() => toggleProfessionalTitle(title)}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${isSelected
                              ? "border-[#C2691C] bg-[#FFD3AC] text-[#1A1A1A]"
                              : "border-[#E7E2D9] hover:border-[#C8996A] bg-white text-[#353535]"
                            }`}
                        >
                          {title}
                        </button>
                      );
                    })}
                  </div>
                  {errors.professionalTitles && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.professionalTitles}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-[#E7E2D9] bg-[#FAF8F5]">
                  <p className="text-xs leading-relaxed" style={{ color: "#6B6862" }}>
                    This information helps us verify your credentials and match you with appropriate patients.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        break;

      case 6:
        if (formData.userType === "doctor") {
          return (
            <div>
              <h2
                className="text-2xl sm:text-3xl font-medium mb-2 text-center select-none"
                style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
              >
                Upload Required Documents
              </h2>
              <p className="text-sm text-center mb-6" style={{ color: "#6B6862" }}>
                Please upload the following documents for verification. All documents will be securely stored.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#E7E2D9] bg-white">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#1A1A1A" }}>
                    Medical License <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("license", e.target.files[0])}
                    className="w-full text-xs text-[#6B6862]"
                  />
                  {documents.license && (
                    <p className="text-xs mt-1 font-medium" style={{ color: "#2E7D32" }}>
                      ✓ {documents.license.name}
                    </p>
                  )}
                  {errors.license && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.license}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-[#E7E2D9] bg-white">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#1A1A1A" }}>
                    Government ID <span style={{ color: "#C0392B" }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("id", e.target.files[0])}
                    className="w-full text-xs text-[#6B6862]"
                  />
                  {documents.id && (
                    <p className="text-xs mt-1 font-medium" style={{ color: "#2E7D32" }}>
                      ✓ {documents.id.name}
                    </p>
                  )}
                  {errors.id && (
                    <p className="text-xs mt-1" style={{ color: "#C0392B" }}>
                      {errors.id}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-[#E7E2D9] bg-white">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#1A1A1A" }}>
                    Certifications <span className="font-normal" style={{ color: "#9A948B" }}>(Optional)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("certifications", e.target.files[0])}
                    className="w-full text-xs text-[#6B6862]"
                  />
                  {documents.certifications && (
                    <p className="text-xs mt-1 font-medium" style={{ color: "#2E7D32" }}>
                      ✓ {documents.certifications.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        }
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center px-4 py-12 sm:py-16">
      <div className="max-w-lg w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-3xl sm:text-4xl font-normal tracking-wide transition-opacity hover:opacity-80 select-none"
            style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: "#1A1A1A" }}
          >
            AMBE®
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] mt-1.5 font-medium" style={{ color: "#C2691C" }}>
            Join our wellness community
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="mb-6 px-2">
          <div className="flex gap-2 mb-2">
            {Array.from({ length: getStepCount() }, (_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i + 1 <= step ? "#C2691C" : "#E7E2D9",
                }}
              />
            ))}
          </div>
          <p className="text-center text-xs font-medium uppercase tracking-wider" style={{ color: "#6B6862" }}>
            Step {step} of {getStepCount()}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-7 sm:p-10 rounded-3xl shadow-xl border border-[#E7E2D9]">
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#F4F1EA]">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                style={{ color: "#6B6862" }}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < getStepCount() ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center px-7 py-3 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white shadow-sm cursor-pointer"
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-1.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.14em] transition-all bg-[#FFD3AC] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            )}
          </div>
        </div>

        {/* Sign in link */}
        <div className="text-center mt-6">
          <p className="text-sm" style={{ color: "#6B6862" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "#C2691C" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}