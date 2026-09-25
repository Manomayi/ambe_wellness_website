"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { auth, functions, db } from '@/lib/firebase/config';
import { sendEmailVerification, updateProfile } from 'firebase/auth';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import PhoneInputWithCountry from '@/components/common/PhoneInputWithCountry';
import Link from 'next/link';
import AmbeButton from '@/components/common/AmbeButton';
import AmbeTextField from '@/components/common/AmbeTextField';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import ProfileCreationAnimation from '@/components/common/ProfileCreationAnimation';

export default function SignUpPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [editingFromConfirmation, setEditingFromConfirmation] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showDoctorAgreementsModal, setShowDoctorAgreementsModal] = useState(false);

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

  const getFormattedDOB = () => {
    const { dobDay, dobMonth, dobYear } = formData;
    if (!dobDay || !dobMonth || !dobYear) return 'Date of birth not set';
    return `${Number(dobDay)} ${dobMonth} ${dobYear}`;
  };

  const handleJumpToStep = (targetStep) => {
    setEditingFromConfirmation(true);
    setStep(targetStep);
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

  const [showCustomSpecialization, setShowCustomSpecialization] = useState(false);

  const PROFESSIONAL_TITLES = ['DO', 'NPR', 'BAMS', 'Other'];
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

  const toggleCustomSpecialization = () => {
    setShowCustomSpecialization(prev => {
      const next = !prev;
      if (!next) {
        updateFormData('customSpecialization', '');
      }
      return next;
    });
    setErrors(prev => ({ ...prev, specialization: '', customSpecialization: '' }));
  };

  const toggleProfessionalTitle = (title) => {
    if (title === 'Other') {
      const isCurrentlySelected = formData.professionalTitles.includes('Other');
      setFormData(prev => ({
        ...prev,
        professionalTitles: isCurrentlySelected
          ? prev.professionalTitles.filter(t => t !== 'Other')
          : [...prev.professionalTitles, 'Other'],
        customProfessionalTitle: isCurrentlySelected ? '' : prev.customProfessionalTitle,
      }));
    } else {
      setFormData(prev => {
        const isSelected = prev.professionalTitles.includes(title);
        return {
          ...prev,
          professionalTitles: isSelected
            ? prev.professionalTitles.filter(t => t !== title)
            : [...prev.professionalTitles, title],
        };
      });
    }
    setErrors(prev => ({ ...prev, professionalTitles: '', customProfessionalTitle: '' }));
  };

  const validateStep = () => {
    const newErrors = {};
    const isDoctor = formData.userType === 'doctor';

    if (step === 1) {
      if (!formData.userType) {
        newErrors.userType = 'Please select a role before continuing.';
      }
    } else if (step === 2) {
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
    } else if (step === 3) {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
    } else if (step === 4) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (isDoctor) {
      if (step === 5) {
        if (formData.specializations.length === 0 && (!showCustomSpecialization || !formData.customSpecialization.trim())) {
          newErrors.specialization = 'Please select at least one field of practice';
        }
        if (showCustomSpecialization && !formData.customSpecialization.trim()) {
          newErrors.customSpecialization = 'Please specify your other specialization';
        }
      } else if (step === 6) {
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
      } else if (step === 7) {
        if (!documents.license) {
          newErrors.license = 'Medical license is required';
        }
        if (!documents.id) {
          newErrors.id = 'Government ID is required';
        }
      } else if (step === 8) {
        // Photo is optional
      } else if (step === 9) {
        if (!termsAccepted) {
          newErrors.terms = 'Please accept the Agreements to proceed';
        }
      }
    } else {
      // Patient steps
      if (step === 5) {
        // Photo is optional
      } else if (step === 6) {
        if (!termsAccepted) {
          newErrors.terms = 'Please accept the Terms and Conditions to proceed';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getStepCount = () => {
    return formData.userType === 'doctor' ? 9 : 6;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (editingFromConfirmation) {
        setEditingFromConfirmation(false);
        setStep(getStepCount());
        return;
      }

      if (step === getStepCount()) {
        handleSubmit();
      } else {
        setStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    setError('');
    if (editingFromConfirmation) {
      setEditingFromConfirmation(false);
      setStep(getStepCount());
      return;
    }
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleFileUpload = (type, file) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
    setErrors(prev => ({ ...prev, [type]: '' }));
  };

  const handleRemoveDocument = (type) => {
    setDocuments(prev => ({ ...prev, [type]: null }));
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
              doctor_fields: (() => {
                const fields = [...formData.specializations];
                if (showCustomSpecialization && formData.customSpecialization.trim() && !fields.includes('general_health')) {
                  fields.push('general_health');
                }
                return fields;
              })(),
              practice_start_year: formData.practiceStartYear
                ? Number(formData.practiceStartYear)
                : null,
              medical_school: formData.medicalSchool,
              professional_title: (() => {
                const nonOther = formData.professionalTitles.filter(t => t !== 'Other');
                const custom = formData.customProfessionalTitle.trim();
                const hasOther = formData.professionalTitles.includes('Other');
                const combined = hasOther && custom ? [...nonOther, custom] : nonOther;
                return combined.join(', ') || null;
              })(),
              custom_professional_title:
                formData.professionalTitles.includes('Other') && formData.customProfessionalTitle.trim()
                  ? formData.customProfessionalTitle.trim()
                  : null,
              documents: documentsPayload,
            }
          : {}),
      });

      if (result.data?.uid) {
        const userType = await signIn(formData.email, formData.password);

        const colName = isDoctor ? 'doctors' : 'users';

        if (profilePhoto) {
          try {
            const storage = getStorage();
            const picRef = storageRef(storage, `images/${result.data.uid}/profile_picture.png`);
            await uploadBytes(picRef, profilePhoto);
            const photoURL = await getDownloadURL(picRef);

            if (auth.currentUser) {
              await updateProfile(auth.currentUser, { photoURL });
            }

            await setDoc(
              doc(db, colName, result.data.uid),
              { profile_picture: photoURL },
              { merge: true }
            );
          } catch (photoErr) {
            console.warn("Profile photo upload warning:", photoErr);
          }
        }

        // Terms acceptance & agreement metadata
        try {
          const termsData = {
            terms_accepted: true,
            terms_accepted_at: serverTimestamp(),
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          };

          if (isDoctor) {
            termsData.accepted_agreements = [
              'Ambe_Employment_Code_of_Conduct.pdf',
              'Ambe_Independent_Contractor_Agreement.pdf',
              'Ambe_NDA_NCA_Doctors.pdf',
            ];
          }

          await setDoc(
            doc(db, colName, result.data.uid),
            termsData,
            { merge: true }
          );
        } catch (termsErr) {
          console.warn("Terms update warning:", termsErr);
        }

        if (!isDoctor) {
          try {
            if (formData.referralCode && formData.referralCode.trim()) {
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
              } else {
                await setDoc(
                  doc(db, 'users', result.data.uid),
                  {
                    has_made_purchase: false,
                    referral_credits: 0,
                  },
                  { merge: true }
                );
              }
            } else {
              await setDoc(
                doc(db, 'users', result.data.uid),
                {
                  has_made_purchase: false,
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

        router.push(
          `/verify-email?email=${encodeURIComponent(formData.email.trim())}&role=${isDoctor ? "doctor" : userType || formData.userType}`
        );
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const renderProfilePhotoStep = () => {
    const isDoctor = formData.userType === 'doctor';
    return (
      <div className="text-center py-2">
        <h2 className="text-white text-xl font-semibold mb-2 font-sans">
          Profile Picture
        </h2>
        <p className="text-gray-400 text-xs mb-6">
          {isDoctor
            ? "Add a professional photo so patients can recognize you."
            : "Add a photo to personalize your profile (optional)."}
        </p>

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative w-32 h-32 rounded-full border-2 border-[#FFD3AC] bg-white/10 flex items-center justify-center overflow-hidden shadow-lg">
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
  };

  const renderConfirmationStep = () => {
    const isDoctor = formData.userType === 'doctor';
    return (
      <div className="space-y-4 py-2">
        <h2 className="text-white text-xl font-semibold text-center mb-6 font-sans">
          Review and Confirm
        </h2>

        {/* Profile Photo with Edit Badge */}
        <div className="flex justify-center mb-6">
          <div
            onClick={() => handleJumpToStep(isDoctor ? 8 : 5)}
            className="relative cursor-pointer group"
            title="Edit profile photo"
          >
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#FFD3AC] overflow-hidden bg-white/10 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
              {profilePhotoPreview ? (
                <img
                  src={profilePhotoPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-14 h-14 text-[#FFD3AC]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FFD3AC] text-[#1E1E1E] flex items-center justify-center shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </div>
          </div>
        </div>

        {/* User Information Pill Cards */}
        <div className="space-y-3">
          {/* Name */}
          <div
            onClick={() => handleJumpToStep(2)}
            className="w-full bg-white rounded-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <svg className="w-5 h-5 text-[#FFD3AC] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <span className="text-black font-medium text-[15px] truncate">
                {formData.firstName || formData.lastName
                  ? `${formData.firstName} ${formData.lastName}`.trim()
                  : "Name not set"}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </div>

          {/* Date of Birth */}
          <div
            onClick={() => handleJumpToStep(2)}
            className="w-full bg-white rounded-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <svg className="w-5 h-5 text-[#FFD3AC] shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-black font-medium text-[15px] truncate">
                {getFormattedDOB()}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </div>

          {/* Email */}
          <div
            onClick={() => handleJumpToStep(2)}
            className="w-full bg-white rounded-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <svg className="w-5 h-5 text-[#FFD3AC] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              <span className="text-black font-medium text-[15px] truncate">
                {formData.email || "Email not set"}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </div>

          {/* Phone */}
          <div
            onClick={() => handleJumpToStep(3)}
            className="w-full bg-white rounded-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <svg className="w-5 h-5 text-[#FFD3AC] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span className="text-black font-medium text-[15px] truncate">
                {formData.phone || "Phone not set"}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </div>
        </div>

        {/* Agreements / Terms Checkbox */}
        <div className="pt-3">
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
              }}
              className="mt-1 w-5 h-5 rounded border-2 border-white/60 checked:bg-[#FFD3AC] checked:border-[#FFD3AC] text-[#1E1E1E] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#FFD3AC]"
            />
            <span className="text-white text-sm font-sans leading-relaxed">
              I accept the{" "}
              {isDoctor ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDoctorAgreementsModal(true);
                  }}
                  className="text-[#FFD3AC] font-bold underline hover:text-white transition inline"
                >
                  Agreements (NDA, Contractor, Code of Conduct)
                </button>
              ) : (
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#FFD3AC] font-bold underline hover:text-white transition inline"
                >
                  Terms and Conditions
                </a>
              )}
              .
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs text-red-400 mt-2 px-1">{errors.terms}</p>
          )}
        </div>
      </div>
    );
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
              <label className="block text-white text-[17px] font-semibold font-sans mb-3 tracking-tight">
                Date of Birth (Optional)
              </label>
              <div className="flex gap-2 sm:gap-3">
                {/* Month Dropdown */}
                <div className="relative flex-[4] min-w-0">
                  <select
                    value={formData.dobMonth}
                    onChange={(e) => updateFormData("dobMonth", e.target.value)}
                    className={`w-full bg-white font-sans text-sm sm:text-[15px] font-medium rounded-full pl-3.5 sm:pl-4 pr-7 sm:pr-8 py-3.5 outline-none border border-transparent focus:border-[#FFD3AC] cursor-pointer appearance-none shadow-sm transition-all duration-200 truncate ${
                      formData.dobMonth ? "text-[#1E1E1E]" : "text-gray-500"
                    }`}
                  >
                    <option value="" className="text-gray-500">Month</option>
                    {months.map((m) => (
                      <option key={m} value={m} className="text-[#1E1E1E]">{m}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 text-[#1E1E1E]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Day Dropdown */}
                <div className="relative flex-[3] min-w-0">
                  <select
                    value={formData.dobDay}
                    onChange={(e) => updateFormData("dobDay", e.target.value)}
                    className={`w-full bg-white font-sans text-sm sm:text-[15px] font-medium rounded-full pl-3.5 sm:pl-4 pr-7 sm:pr-8 py-3.5 outline-none border border-transparent focus:border-[#FFD3AC] cursor-pointer appearance-none shadow-sm transition-all duration-200 truncate ${
                      formData.dobDay ? "text-[#1E1E1E]" : "text-gray-500"
                    }`}
                  >
                    <option value="" className="text-gray-500">Day</option>
                    {days.map((d) => (
                      <option key={d} value={d} className="text-[#1E1E1E]">{d}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 text-[#1E1E1E]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Year Dropdown */}
                <div className="relative flex-[3] min-w-0">
                  <select
                    value={formData.dobYear}
                    onChange={(e) => updateFormData("dobYear", e.target.value)}
                    className={`w-full bg-white font-sans text-sm sm:text-[15px] font-medium rounded-full pl-3.5 sm:pl-4 pr-7 sm:pr-8 py-3.5 outline-none border border-transparent focus:border-[#FFD3AC] cursor-pointer appearance-none shadow-sm transition-all duration-200 truncate ${
                      formData.dobYear ? "text-[#1E1E1E]" : "text-gray-500"
                    }`}
                  >
                    <option value="" className="text-gray-500">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y} className="text-[#1E1E1E]">{y}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 sm:pr-3 text-[#1E1E1E]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-white text-[17px] font-semibold font-sans mb-3 tracking-tight">
                Sex Assigned at Birth (Optional)
              </label>
              <div className="relative">
                <select
                  value={formData.genderAtBirth}
                  onChange={(e) => updateFormData("genderAtBirth", e.target.value)}
                  className={`w-full bg-white font-sans text-sm sm:text-[15px] font-medium rounded-full pl-5 pr-10 py-3.5 outline-none border border-transparent focus:border-[#FFD3AC] cursor-pointer appearance-none shadow-sm transition-all duration-200 ${
                    formData.genderAtBirth ? "text-[#1E1E1E]" : "text-gray-500"
                  }`}
                >
                  <option value="" className="text-gray-500">Select</option>
                  <option value="Male" className="text-[#1E1E1E]">Male</option>
                  <option value="Female" className="text-[#1E1E1E]">Female</option>
                  <option value="Other" className="text-[#1E1E1E]">Other</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1E1E1E]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Referral Code - matches Flutter StepPersonalInfoUser placement */}
            {formData.userType !== "doctor" && (
              <div className="pt-2">
                <label className="block text-white text-[17px] font-semibold font-sans mb-3 tracking-tight">
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
        if (formData.userType !== "doctor") {
          return renderProfilePhotoStep();
        }
        // Doctor: Field of Practice (Clinical Focus Areas)
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-1 font-sans">
              Field of Practice
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm text-center mb-5 font-sans">
              Select all that apply to you
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {specializations.map(({ value, label }) => {
                const sel = formData.specializations.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleSpecialization(value)}
                    className={`
                      w-full p-3.5 px-4 text-left rounded-2xl text-[15px] transition-all duration-150 cursor-pointer border flex items-center justify-between
                      ${
                        sel
                          ? "bg-[#FFD3AC] text-[#1E1E1E] border-[#FFD3AC] font-semibold shadow-sm"
                          : "bg-white text-[#1E1E1E] border-gray-200 font-medium hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{label}</span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ml-3 transition-colors ${
                        sel
                          ? "bg-black text-white"
                          : "border-2 border-gray-400 bg-white"
                      }`}
                    >
                      {sel && (
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
                onClick={toggleCustomSpecialization}
                className={`
                  w-full p-3.5 px-4 text-left rounded-2xl text-[15px] transition-all duration-150 cursor-pointer border flex items-center justify-between
                  ${
                    showCustomSpecialization
                      ? "bg-[#FFD3AC] text-[#1E1E1E] border-[#FFD3AC] font-semibold shadow-sm"
                      : "bg-white text-[#1E1E1E] border-gray-200 font-medium hover:bg-gray-50"
                  }
                `}
              >
                <span>Other (Please specify)</span>
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ml-3 transition-colors ${
                    showCustomSpecialization
                      ? "bg-black text-white"
                      : "border-2 border-gray-400 bg-white"
                  }`}
                >
                  {showCustomSpecialization && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
            {errors.specialization && (
              <p className="text-xs text-red-400 px-1">{errors.specialization}</p>
            )}

            {showCustomSpecialization && (
              <div className="pt-2">
                <AmbeTextField
                  placeholder="Enter your specialization"
                  value={formData.customSpecialization}
                  onChange={(e) => updateFormData("customSpecialization", e.target.value)}
                  error={errors.customSpecialization}
                  leadingIcon={
                    <svg className="w-5 h-5 text-[#FFD3AC]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        );

      case 6:
        if (formData.userType !== "doctor") {
          return renderConfirmationStep();
        }
        // Doctor: Career Information matching app Image 2
        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-6 font-sans">
              Career Information
            </h2>

            {/* Year Practice Started */}
            <div>
              <label className="block text-sm font-medium text-white mb-2 font-sans">
                Year Practice Started
              </label>
              <AmbeTextField
                placeholder="Enter year (e.g., 2010)"
                value={formData.practiceStartYear}
                onChange={(e) => updateFormData("practiceStartYear", e.target.value)}
                error={errors.practiceStartYear}
                leadingIcon={
                  <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
            </div>

            {/* Medical School */}
            <div>
              <label className="block text-sm font-medium text-white mb-2 font-sans">
                Medical School
              </label>
              <AmbeTextField
                placeholder="Enter your medical school"
                value={formData.medicalSchool}
                onChange={(e) => updateFormData("medicalSchool", e.target.value)}
                error={errors.medicalSchool}
                leadingIcon={
                  <svg className="w-5 h-5 text-[#FFD3AC]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                  </svg>
                }
              />
            </div>

            {/* Professional Titles */}
            <div>
              <label className="block text-sm font-medium text-white mb-2 font-sans">
                Professional Titles (Select all that apply)
              </label>
              <div className="p-4 rounded-2xl bg-[#2D2D30]/90 border border-white/15">
                <div className="flex flex-wrap gap-2.5">
                  {PROFESSIONAL_TITLES.map((t) => {
                    const sel = formData.professionalTitles.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleProfessionalTitle(t)}
                        className={`
                          px-4 py-2 rounded-full text-xs sm:text-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5 border
                          ${
                            sel
                              ? "bg-[#FFD3AC] text-[#1E1E1E] font-bold border-[#FFD3AC] shadow-sm"
                              : "bg-transparent border-white/30 text-white font-medium hover:border-white/60"
                          }
                        `}
                      >
                        {sel && (
                          <svg className="w-3.5 h-3.5 text-[#1E1E1E] shrink-0" fill="none" stroke="currentColor" strokeWidth={2.8} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {errors.professionalTitles && (
                <p className="text-xs text-red-400 mt-1.5 px-2">{errors.professionalTitles}</p>
              )}
            </div>

            {/* Custom Professional Title (when Other is selected) */}
            {formData.professionalTitles.includes("Other") && (
              <div className="pt-1">
                <AmbeTextField
                  placeholder="Enter your professional title (e.g., MBBS, PhD)"
                  value={formData.customProfessionalTitle}
                  onChange={(e) => updateFormData("customProfessionalTitle", e.target.value)}
                  error={errors.customProfessionalTitle}
                  leadingIcon={
                    <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.364a4.125 4.125 0 00-6.338 0 .375.375 0 01-.266.111h6.87c-.098 0-.193-.04-.266-.111z" />
                    </svg>
                  }
                />
              </div>
            )}
          </div>
        );

      case 7:
        // Doctor documents
        const docSlots = [
          {
            type: "license",
            title: "Medical License",
            subtitle: "Upload your medical license document.",
            required: true,
          },
          {
            type: "id",
            title: "Government ID",
            subtitle: "Upload a government-issued photo ID.",
            required: true,
          },
          {
            type: "certifications",
            title: "Certification",
            subtitle: "Upload any relevant certification (optional).",
            required: false,
          },
        ];

        return (
          <div className="space-y-4 py-2">
            <h2 className="text-white text-xl font-semibold text-center mb-1 font-sans">
              Upload Documents
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm text-center mb-4 font-sans">
              Provide your verification credentials
            </p>

            <div className="space-y-4 max-h-[380px] overflow-y-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {docSlots.map(({ type, title, subtitle, required }) => {
                const file = documents[type];
                const error = errors[type];

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-white text-[17px] font-semibold font-sans">
                        {title}
                      </span>
                      {required ? (
                        <span className="text-[#FFD3AC] text-lg font-semibold ml-1.5">*</span>
                      ) : (
                        <span className="text-gray-400 text-xs sm:text-sm ml-2 font-sans">(optional)</span>
                      )}
                    </div>

                    {file ? (
                      <div className="relative w-full rounded-2xl bg-[#1E1E1E]/95 border border-[#FFD3AC]/70 p-3.5 flex items-center justify-between shadow-md">
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <div className="w-10 h-10 rounded-xl bg-[#FFD3AC]/20 text-[#FFD3AC] flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{file.name}</p>
                            <p className="text-gray-400 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(type)}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center shrink-0 transition"
                          title="Remove file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="block w-full cursor-pointer group">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.heic"
                          onChange={(e) => handleFileUpload(type, e.target.files?.[0])}
                          className="hidden"
                        />
                        <div className="w-full h-28 sm:h-32 rounded-2xl border-2 border-dashed border-[#6B6B6B] group-hover:border-[#FFD3AC] bg-white/[0.02] group-hover:bg-white/[0.06] transition-all duration-200 flex flex-col items-center justify-center p-3 text-center">
                          <svg className="w-7 h-7 text-[#FFD3AC] mb-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V3.75m0 0L7.5 8.25m4.5-4.5l4.5 4.5M4.5 19.5h15" />
                          </svg>
                          <span className="text-gray-400 text-xs sm:text-[13px] px-2 leading-relaxed">
                            {subtitle}
                          </span>
                        </div>
                      </label>
                    )}

                    {error && (
                      <p className="text-xs text-red-400 px-1">{error}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 8:
        // Doctor: Profile Picture
        return renderProfilePhotoStep();

      case 9:
        // Doctor: Review and Confirm
        return renderConfirmationStep();
    }
  };

  return (
    <>
      {/* Doctor Agreements Modal */}
      {showDoctorAgreementsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1E1E1E] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-left">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Doctor Agreements</h3>
              <button
                type="button"
                onClick={() => setShowDoctorAgreementsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 mb-4">
              Please review each required practitioner document prior to registration:
            </p>
            <div className="space-y-3">
              {[
                { title: "Employment Code of Conduct", file: "Ambe_Employment_Code_of_Conduct.pdf" },
                { title: "Independent Contractor Agreement", file: "Ambe_Independent_Contractor_Agreement.pdf" },
                { title: "NDA & NCA", file: "Ambe_NDA_NCA_Doctors.pdf" },
              ].map(({ title, file }) => (
                <a
                  key={file}
                  href={`/terms/${file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-[#FFD3AC]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm font-medium text-white group-hover:text-[#FFD3AC] transition">
                      {title}
                    </span>
                  </div>
                  <span className="text-xs text-[#FFD3AC] font-medium flex items-center gap-1">
                    View
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowDoctorAgreementsModal(false);
                  if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                }}
                className="w-full py-3 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#FFD3AC] text-[#1E1E1E] hover:bg-white transition cursor-pointer"
              >
                Accept and Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col justify-between px-2 sm:px-4">
        {/* Top Bar matching Flutter RegistrationScaffold */}
        <div>
          <div className="flex items-center gap-4 pt-2 pb-4">
            <AmbeBackButton onClick={step > 1 || editingFromConfirmation ? handleBack : () => router.push("/login")} />
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
              {editingFromConfirmation
                ? "SAVE & RETURN"
                : step === getStepCount()
                ? (loading ? "CREATING ACCOUNT…" : "COMPLETE")
                : "NEXT"}
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

      {loading && <ProfileCreationAnimation />}
    </>
  );
}
