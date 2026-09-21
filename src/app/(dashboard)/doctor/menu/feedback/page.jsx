'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import {
  ChatBubbleBottomCenterTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function DoctorFeedbackPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    average: '0.0',
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
          if (err?.code === 'permission-denied') return;
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
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const renderStars = (rating, size = 'h-4 w-4') => {
    const num = Math.round(Number(rating) || 0);
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`${size} ${star <= num ? 'text-[#FFD3AC]' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-12 w-12 rounded-full border-4 border-t-4 border-[#FFD3AC] border-t-transparent" />
      </div>
    );
  }

  return (
    <WebLayoutWrapper>
      <div className="space-y-6 max-w-2xl mx-auto pb-16">
        {/* Header matching Flutter */}
        <div className="space-y-3 pt-2">
          <AmbeBackButton onClick={() => router.push('/doctor/menu')} />
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">
                Patient Reviews
              </h1>
              <p className="text-sm text-gray-400 mt-1 font-sans">
                Feedback and ratings submitted by your patients following consultations.
              </p>
            </div>
            {stats.total > 0 && (
              <span className="px-3.5 py-1.5 bg-[#FFD3AC]/15 text-[#FFD3AC] text-xs font-semibold rounded-full border border-[#FFD3AC]/30 font-sans">
                {stats.total} {stats.total === 1 ? 'Review' : 'Reviews'}
              </span>
            )}
          </div>
        </div>

        {reviews.length === 0 ? (
          /* Empty State matching Flutter */
          <div className="bg-[#2D2D30]/80 border border-white/10 rounded-2xl p-16 text-center shadow-lg backdrop-blur-md">
            <div className="h-16 w-16 bg-[#1B1A18] rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <ChatBubbleBottomCenterTextIcon className="h-8 w-8 text-[#FFD3AC]" />
            </div>
            <h2 className="text-xl font-bold text-white font-sans">No Reviews Yet</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto font-sans">
              Patient reviews will appear here once patients complete their post-consultation feedback.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Rating Summary Card matching Flutter */}
            <div className="bg-[#2D2D30]/80 border border-[#FFD3AC]/30 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                {/* Average Score Column */}
                <div className="text-center sm:border-r sm:border-white/10 sm:pr-8 sm:min-w-[170px]">
                  <div className="text-5xl font-extrabold text-white font-sans">
                    {stats.average}
                  </div>
                  <div className="flex justify-center my-3">
                    {renderStars(stats.average, 'h-6 w-6')}
                  </div>
                  <p className="text-xs text-gray-400 font-sans">
                    Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Distribution Bars Column */}
                <div className="flex-1 w-full space-y-2.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star] || 0;
                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center space-x-3 text-xs">
                        <span className="w-3 font-semibold text-gray-400 font-sans">{star}</span>
                        <StarIconSolid className="h-4 w-4 text-[#FFD3AC] shrink-0" />
                        <div className="flex-1 h-2 bg-[#1B1A18] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FFD3AC] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right font-medium text-gray-400 font-sans">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews Section Title matching Flutter */}
            <div className="flex items-center gap-2.5 pt-2">
              <h2 className="text-lg font-bold text-white font-sans">All Reviews</h2>
              <span className="px-2.5 py-0.5 bg-[#FFD3AC]/20 text-[#FFD3AC] text-xs font-semibold rounded-full font-sans">
                {stats.total}
              </span>
            </div>

            {/* Reviews List matching Flutter */}
            <div className="space-y-4">
              {reviews.map((item) => {
                const userName = item.userName || item.user_name || 'Anonymous';
                const userPhoto = item.userPhoto || item.user_photo;

                return (
                  <div
                    key={item.id}
                    className="bg-[#2D2D30]/80 border border-white/10 rounded-2xl p-5 shadow-md backdrop-blur-md space-y-3"
                  >
                    <div className="flex items-center space-x-3.5">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-[#1E1E1E] border border-[#FFD3AC]/30 flex items-center justify-center shrink-0">
                        {userPhoto ? (
                          <img
                            src={userPhoto}
                            alt={userName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <UserIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* User Name + Stars + Date directly underneath (matching Flutter) */}
                      <div>
                        <h3 className="text-base font-semibold text-white font-sans">
                          {userName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(item.rating, 'h-4 w-4')}
                          <span className="text-xs text-gray-400 font-medium font-sans">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Review Text directly underneath (matching Flutter) */}
                    {item.review && (
                      <p className="text-sm text-gray-300 leading-relaxed font-sans pt-1">
                        {item.review}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </WebLayoutWrapper>
  );
}