"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  GiftIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import BackButton from '@/components/common/BackButton';

export default function ReferFriendPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralCredits, setReferralCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      generateReferralCode();
    }
  }, [user]);

  async function generateReferralCode() {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      if (!userData.referred_by && userData.referral_code_used) {
        const code = String(userData.referral_code_used).trim().toUpperCase();
        const refQuery = query(collection(db, 'users'), where('referral_code', '==', code), limit(1));
        const refSnap = await getDocs(refQuery);
        if (!refSnap.empty && refSnap.docs[0].id !== user.uid) {
          const referrerId = refSnap.docs[0].id;
          await updateDoc(userDocRef, {
            referred_by: referrerId,
            has_made_purchase: userData.has_made_purchase || false
          }).catch(() => {});
          userData.referred_by = referrerId;
        }
      }

      const q = query(collection(db, 'users'), where('referred_by', '==', user.uid));
      const snap = await getDocs(q);
      let validReferredFriendsCount = 0;
      for (const friendDoc of snap.docs) {
        const friendData = friendDoc.data();
        let hasPurchased = friendData.has_made_purchase === true || friendData.referral_status === 'completed';
        if (!hasPurchased) {
          const purchasesSnap = await getDocs(collection(db, 'users', friendDoc.id, 'purchases'));
          if (!purchasesSnap.empty) {
            hasPurchased = true;
            await updateDoc(doc(db, 'users', friendDoc.id), {
              has_made_purchase: true,
              referral_reward_granted: true,
              referral_status: 'completed'
            }).catch(() => {});
          }
        }
        if (hasPurchased) {
          validReferredFriendsCount++;
        }
      }

      const spentOrders = Array.isArray(userData.referral_credit_orders) ? userData.referral_credit_orders : [];
      let spentCount = spentOrders.length;
      const myPurchasesSnap = await getDocs(collection(db, 'users', user.uid, 'purchases'));
      if (myPurchasesSnap.size > spentCount && !userData.referred_by) {
        spentCount = Math.min(validReferredFriendsCount, myPurchasesSnap.size);
      }

      const exactCreditsAvailable = Math.max(0, validReferredFriendsCount - spentCount);

      let code = userData.referral_code;
      if (!code) {
        code = user.uid.substring(0, 8).toUpperCase();
      }

      await updateDoc(userDocRef, {
        referral_code: code,
        referral_count: validReferredFriendsCount,
        referral_credits: exactCreditsAvailable
      }).catch(() => {});

      setReferralCode(code);
      setReferralCount(validReferredFriendsCount);
      setReferralCredits(exactCreditsAvailable);
    } catch (error) {
      console.error('Error generating referral code:', error);
      setReferralCode(user.uid.substring(0, 8).toUpperCase());
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareReferralCode() {
    const message = `Join Ambe Wellness and get 20% off your first order! Use my referral code: ${referralCode}\n\nSign up and start your wellness journey today!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Ambe Wellness',
        text: message,
      }).catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      });
    } else {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <WebLayoutWrapper>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
          </div>
        </WebLayoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <WebLayoutWrapper>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <BackButton />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Refer a Friend</h1>

          {/* Hero Promo Card — peach bg matching Flutter */}
          <div className="bg-[#FFD3AC] rounded-3xl p-6 sm:p-8 text-center shadow-[0_8px_20px_rgba(255,211,172,0.25)]">
            {/* Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider bg-black/10 text-black/80 mb-4">
              <GiftIcon className="w-4 h-4" />
              GIVE 20% · GET 20%
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold text-black leading-tight mb-1">
              Get 20% OFF
            </h2>
            <p className="text-lg text-black/80 font-medium">
              Your Next Order
            </p>
            <p className="text-sm text-black/60 max-w-md mx-auto leading-relaxed mt-3">
              Share your referral code with friends and both of you will receive 20% off your order!
            </p>
          </div>

          {/* Referral Code Card — frosted glass matching Flutter */}
          <div className="bg-white/8 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/12">
            <h3 className="text-sm font-semibold text-white/70 text-center tracking-wider uppercase mb-4">
              Your Referral Code
            </h3>
            <div className="bg-black/40 border-[1.5px] border-[#FFD3AC]/40 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-4">
              <span className="flex-1 text-center text-xl sm:text-2xl font-extrabold tracking-[3px] text-[#FFD3AC]">
                {referralCode}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2.5 bg-[#FFD3AC]/15 rounded-xl hover:bg-[#FFD3AC]/25 transition cursor-pointer"
                title="Copy code"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5 text-[#FFD3AC]" />
                ) : (
                  <DocumentDuplicateIcon className="h-5 w-5 text-[#FFD3AC]" />
                )}
              </button>
            </div>
            <button
              onClick={shareReferralCode}
              className="w-full mt-4 bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1A1A1A] py-3.5 px-6 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-md uppercase tracking-wider cursor-pointer"
            >
              <ShareIcon className="h-5 w-5" />
              Share Code
            </button>
          </div>

          {/* Referral Stats — frosted glass matching Flutter */}
          {(referralCount > 0 || referralCredits > 0) && (
            <div className="bg-white/8 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-[#FFD3AC]/30">
              <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-5">
                Your Referral Stats
              </h3>
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#FFD3AC]">{referralCount}</p>
                  <p className="text-xs sm:text-sm font-medium text-white/70 mt-1">Friends Referred</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-[#FFD3AC]">{referralCredits}</p>
                  <p className="text-xs sm:text-sm font-medium text-white/70 mt-1">Discounts Available</p>
                </div>
              </div>
            </div>
          )}

          {/* How It Works — frosted glass matching Flutter */}
          <div className="bg-white/6 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/10">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-5">How It Works</h3>
            <div className="space-y-4">
              <StepWidget number="1" text="Share your unique referral code with friends." />
              <StepWidget number="2" text="Your friend signs up and gets 20% off their first order." />
              <StepWidget number="3" text="You receive a 20% discount credit for your next order!" />
              <StepWidget number="4" text="Refer 3 friends and you get 20% off each of your next 3 orders — one credit per order, no limit on earnings!" />
            </div>
          </div>
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}

function StepWidget({ number, text }) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="w-7 h-7 bg-[#FFD3AC]/20 border border-[#FFD3AC] text-[#FFD3AC] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
        {number}
      </div>
      <p className="text-sm text-white/85 leading-relaxed">{text}</p>
    </div>
  );
}