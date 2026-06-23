"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
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

export default function GetMatched() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matched, setMatched] = useState(false);
  const [error, setError] = useState('');

  const toggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else if (selectedFields.length < 3) {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleMatch = async () => {
    if (selectedFields.length === 0) {
      setError('Please select at least one health field');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const matchWithDoctor = httpsCallable(functions, 'matchWithDoctor');
      const result = await matchWithDoctor({
        healthFields: selectedFields,
      });

      if (result.data.success) {
        setMatched(true);
        setTimeout(() => {
          router.push('/user/home');
        }, 2000);
      } else {
        setError(result.data.message || 'Failed to match with a doctor');
      }
    } catch (err) {
      console.error('Matching error:', err);
      setError('An error occurred while matching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.doctor) {
    router.push('/user/home');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {!matched ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Get Matched with Your Healthcare Provider
            </h1>
            <p className="text-lg text-gray-600">
              Select up to 3 health areas you'd like to focus on. We'll match you with the perfect healthcare provider.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              What are your primary health concerns?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {HEALTH_FIELDS.map((field) => (
                <button
                  key={field.value}
                  onClick={() => toggleField(field.value)}
                  disabled={!selectedFields.includes(field.value) && selectedFields.length >= 3}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedFields.includes(field.value)
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <div className="text-3xl mb-2">{field.icon}</div>
                  <div className="font-medium text-gray-800">{field.label}</div>
                </button>
              ))}
            </div>

            {selectedFields.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected fields ({selectedFields.length}/3):</strong>{' '}
                  {selectedFields.map(field => 
                    HEALTH_FIELDS.find(f => f.value === field)?.label
                  ).join(', ')}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleMatch}
              disabled={loading || selectedFields.length === 0}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Matching you with the perfect doctor...
                </span>
              ) : (
                'Find My Healthcare Provider'
              )}
            </button>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">How it works:</h3>
            <ol className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">1.</span>
                Select your health priorities (up to 3)
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">2.</span>
                Our system matches you with a qualified healthcare provider
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">3.</span>
                Schedule your first consultation to begin your wellness journey
              </li>
            </ol>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-24 w-24 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Perfect Match Found!
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We've successfully matched you with a healthcare provider who specializes in your selected areas.
          </p>
          <p className="text-gray-500">
            Redirecting you to your dashboard...
          </p>
        </div>
      )}
    </div>
  );
}