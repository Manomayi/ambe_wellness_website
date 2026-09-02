'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import {
  StarIcon as StarIconOutline,
  ChatBubbleBottomCenterTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function DoctorFeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    let unsubSnapshot = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Query the unified top-level `reviews` collection for targetType == 'doctor' and targetId == doctorId
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('targetType', '==', 'doctor'),
        where('targetId', '==', user.uid)
      );

      unsubSnapshot = onSnapshot(
        reviewsQuery,
        (snapshot) => {
          const items = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .sort((a, b) => {
              const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
              const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
              return bTime - aTime;
            });

          setReviews(items);

          // Calculate statistics
          const total = items.length;
          let sum = 0;
          const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

          items.forEach((item) => {
            const r = Math.min(5, Math.max(1, Math.round(Number(item.rating) || 0)));
            if (r >= 1 && r <= 5) {
              dist[r] = (dist[r] || 0) + 1;
            }
            sum += Number(item.rating) || 0;
          });

          setStats({
            average: total > 0 ? (sum / total).toFixed(1) : '0.0',
            total,
            distribution: dist,
          });

          setLoading(false);
        },
        (err) => {
          console.error('Error listening to reviews:', err);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [router]);

  const formatDate = (val) => {
    if (!val) return '';
    const date = val.toDate ? val.toDate() : (val.seconds ? new Date(val.seconds * 1000) : new Date(val));
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating, size = 'h-5 w-5') => {
    const num = Math.round(Number(rating) || 0);
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= num ? (
            <StarIconSolid key={star} className={`${size} text-[#C8996A]`} />
          ) : (
            <StarIconOutline key={star} className={`${size} text-[#E7E2D9]`} />
          )
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-4 border-[#C8996A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="space-y-2">
        <BackButton href="/doctor/menu" label="Back to Menu" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Patient Reviews</h1>
            <p className="text-sm text-[#6B6862] mt-1">
              Feedback and ratings submitted by your patients following consultations.
            </p>
          </div>
          {stats.total > 0 && (
            <span className="px-3.5 py-1.5 bg-[#FFD3AC]/30 text-[#C8996A] text-xs font-bold rounded-full border border-[#C8996A]/30">
              {stats.total} Review{stats.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#E7E2D9] p-16 text-center shadow-sm">
          <div className="h-16 w-16 bg-[#FAF8F5] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#E7E2D9]">
            <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-[#C8996A]" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">No Reviews Yet</h2>
          <p className="text-sm text-[#6B6862] mt-2 max-w-md mx-auto">
            Patient reviews will appear here once patients complete their post-consultation feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Rating Summary Card */}
          <div className="bg-white rounded-2xl border border-[#E7E2D9] p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Average Score Column */}
              <div className="md:col-span-4 text-center md:border-r md:border-[#E7E2D9] md:pr-8">
                <div className="text-5xl font-extrabold text-[#1A1A1A]">
                  {stats.average}
                </div>
                <div className="flex justify-center my-3">
                  {renderStars(stats.average, 'h-6 w-6')}
                </div>
                <p className="text-xs text-[#8C827A]">
                  Based on {stats.total} patient review{stats.total !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Distribution Bars Column */}
              <div className="md:col-span-8 space-y-2.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;

                  return (
                    <div key={star} className="flex items-center space-x-3 text-xs">
                      <span className="w-4 font-semibold text-[#1A1A1A]">{star}</span>
                      <StarIconSolid className="h-4 w-4 text-[#C8996A] shrink-0" />
                      <div className="flex-1 h-2.5 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E7E2D9]">
                        <div
                          className="h-full bg-[#C8996A] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium text-[#8C827A]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">All Patient Reviews</h2>
            <div className="space-y-4">
              {reviews.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#E7E2D9] p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      {item.userPhoto || item.user_photo ? (
                        <img
                          src={item.userPhoto || item.user_photo}
                          alt={item.userName || item.user_name || 'Patient'}
                          className="h-11 w-11 rounded-full object-cover border border-[#E7E2D9]"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-[#FFD3AC]/40 text-[#C8996A] flex items-center justify-center font-bold text-sm shrink-0 border border-[#C8996A]/20">
                          {item.userName
                            ? item.userName.charAt(0).toUpperCase()
                            : item.user_name
                            ? item.user_name.charAt(0).toUpperCase()
                            : 'P'}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-[#1A1A1A]">
                          {item.userName || item.user_name || 'Anonymous Patient'}
                        </h3>
                        <p className="text-xs text-[#8C827A] mt-0.5">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center space-x-1.5 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#E7E2D9]">
                      <StarIconSolid className="h-4 w-4 text-[#C8996A]" />
                      <span className="text-xs font-bold text-[#1A1A1A]">
                        {Number(item.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  {item.review && (
                    <div className="mt-4 text-sm text-[#4A4A4A] leading-relaxed bg-[#FAF8F5]/60 p-4 rounded-xl border border-[#E7E2D9]/60">
                      "{item.review}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}