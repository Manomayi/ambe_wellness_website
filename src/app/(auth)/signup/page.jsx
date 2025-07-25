"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { ArrowRightIcon, ArrowLeftIcon, PhoneIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
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
    specialization: '',
    customSpecialization: '',
  });

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

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
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
        break;
      
      case 3: // Phone number
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\+?\d{10,15}$/.test(formData.phone.replace(/[\s-]/g, ''))) {
          newErrors.phone = 'Invalid phone number';
        }
        break;
      
      case 4: // Doctor specialization
        if (formData.userType === 'doctor') {
          if (!formData.specialization) {
            newErrors.specialization = 'Please select a specialization';
          }
          if (formData.specialization === 'general_health' && !formData.customSpecialization.trim()) {
            newErrors.customSpecialization = 'Please specify your specialization';
          }
        }
        break;
      
      case 5: // Doctor documents
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

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    setError('');

    try {
      // Create user with Firebase Auth
      const user = await signUp(formData.email, formData.password, formData.userType);

      // Call cloud function to create user profile
      const createUser = httpsCallable(functions, 'createUser');
      const result = await createUser({
        uid: user.uid,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        user_type: formData.userType,
        specialization: formData.specialization,
        customSpecialization: formData.customSpecialization,
      });

      if (result.data.success) {
        // If doctor, upload documents
        if (formData.userType === 'doctor' && documents.license) {
          // Upload documents logic would go here
          // For now, we'll skip actual file upload
        }

        // Navigate to appropriate onboarding
        router.push(formData.userType === 'doctor' ? '/doctor/onboarding' : '/user/onboarding');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const getStepCount = () => {
    return formData.userType === 'doctor' ? 5 : 3;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Join as a User or Doctor</h2>
            <div className="space-y-4">
              {['user', 'doctor'].map((type) => (
                <button
                  key={type}
                  onClick={() => updateFormData('userType', type)}
                  className={`w-full p-4 border-2 rounded-lg transition-all ${
                    formData.userType === type
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <h3 className="font-semibold text-lg">
                    {type === 'user' ? 'I am a User' : 'I am a Healthcare Provider'}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {type === 'user' 
                      ? 'Book consultations and manage your wellness journey'
                      : 'Provide consultations and manage your practice'
                    }
                  </p>
                </button>
              ))}
            </div>
            {errors.userType && (
              <p className="text-red-600 text-sm mt-2">{errors.userType}</p>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="At least 6 characters"
                />
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Add Your Phone Number</h2>
            <p className="text-gray-600 mb-6">
              We'll use this to send appointment reminders and important updates.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        );

      case 4:
        if (formData.userType === 'doctor') {
          return (
            <div>
              <h2 className="text-2xl font-bold mb-6">Select Your Specialization</h2>
              <div className="space-y-3">
                {specializations.map((spec) => (
                  <button
                    key={spec.value}
                    onClick={() => updateFormData('specialization', spec.value)}
                    className={`w-full p-3 text-left border rounded-lg transition-all ${
                      formData.specialization === spec.value
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
              {errors.specialization && (
                <p className="text-red-600 text-sm mt-2">{errors.specialization}</p>
              )}

              {formData.specialization === 'general_health' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">
                    Please specify your specialization
                  </label>
                  <input
                    type="text"
                    value={formData.customSpecialization}
                    onChange={(e) => updateFormData('customSpecialization', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Dermatology, Cardiology, etc."
                  />
                  {errors.customSpecialization && (
                    <p className="text-red-600 text-sm mt-1">{errors.customSpecialization}</p>
                  )}
                </div>
              )}
            </div>
          );
        }
        break;

      case 5:
        if (formData.userType === 'doctor') {
          return (
            <div>
              <h2 className="text-2xl font-bold mb-6">Upload Required Documents</h2>
              <p className="text-gray-600 mb-6">
                Please upload the following documents for verification. All documents will be securely stored.
              </p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Medical License <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('license', e.target.files[0])}
                    className="w-full p-2 border rounded-lg"
                  />
                  {documents.license && (
                    <p className="text-green-600 text-sm mt-1">✓ {documents.license.name}</p>
                  )}
                  {errors.license && (
                    <p className="text-red-600 text-sm mt-1">{errors.license}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Government ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('id', e.target.files[0])}
                    className="w-full p-2 border rounded-lg"
                  />
                  {documents.id && (
                    <p className="text-green-600 text-sm mt-1">✓ {documents.id.name}</p>
                  )}
                  {errors.id && (
                    <p className="text-red-600 text-sm mt-1">{errors.id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Certifications (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload('certifications', e.target.files[0])}
                    className="w-full p-2 border rounded-lg"
                  />
                  {documents.certifications && (
                    <p className="text-green-600 text-sm mt-1">✓ {documents.certifications.name}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-4xl font-bold text-gray-800">
            AMBE®
          </Link>
          <p className="text-gray-600 mt-2">Join our wellness community</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {Array.from({ length: getStepCount() }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  i + 1 <= step ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-600">
            Step {step} of {getStepCount()}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-2xl shadow-xl">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < getStepCount() ? (
              <button
                onClick={handleNext}
                className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
              >
                Next
                <ArrowRightIcon className="h-5 w-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            )}
          </div>
        </div>

        {/* Sign in link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}