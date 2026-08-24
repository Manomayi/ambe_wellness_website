"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

// Writes to the same top-level `reviews` collection the mobile app's
// FeedbackPage uses (lib/features/user/consult/post_consultation/feedback_page.dart),
// with identical field names, so a review submitted from either platform
// shows up correctly in the doctor's Patient Reviews screen.
function ConsultationFeedbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();

  const doctorUid = searchParams.get('doctorUid');
  const doctorName = searchParams.get('doctorName');

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorUid) {
      setError('Missing doctor information — please return to Consult and try again.');
      return;
    }
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!review.trim()) {
      setError('Please share your experience.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, 'reviews'), {
        targetType: 'doctor',
        targetId: doctorUid,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhoto: profile?.profile_picture || user.photoURL || null,
        rating,
        review: review.trim(),
        createdAt: serverTimestamp(),
      });
      router.push('/user/consult');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            How was your consultation experience?
          </h1>
          {doctorName && (
            <p className="text-[#6B6862] mt-1">with Dr. {doctorName}</p>
          )}
          <p className="text-[#6B6862] text-sm mt-2">
            Your feedback helps us improve our service
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            placeholder="Share your experience..."
            className="w-full rounded-lg border border-[#E7E2D9] p-3 text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C8996A]"
          />

          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-lg p-6 text-center">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Rate Your Experience</h3>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= displayRating;
                const Star = filled ? StarIconSolid : StarIconOutline;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star className="w-9 h-9 text-[#C8996A]" />
                  </button>
                );
              })}
            </div>
            {displayRating > 0 && (
              <p className="text-[#C8996A] text-sm font-medium mt-3">
                {RATING_LABELS[displayRating]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#FFD3AC] text-[#1A1A1A] hover:text-white py-4 rounded-lg hover:bg-[#1A1A1A] transition font-medium disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ConsultationFeedbackPage() {
  return (
    <ProtectedRoute userType="user">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      }>
        <ConsultationFeedbackPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}
