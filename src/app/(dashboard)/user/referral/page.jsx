"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import {
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  GiftIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let code = userData.referral_code;
        
        if (!code) {
          // Generate new code if doesn't exist
          code = user.uid.substring(0, 8).toUpperCase();
          await updateDoc(doc(db, 'users', user.uid), {
            referral_code: code
          });
        }
        
        setReferralCode(code);
        setReferralCount(userData.referral_count || 0);
        setReferralCredits(userData.referral_credits || 0);
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      // Fallback code
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
    const message = `Join Ambe Wellness and get 25% off your first order! Use my referral code: ${referralCode}\n\nSign up and start your wellness journey today!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Ambe Wellness',
        text: message,
      }).catch((error) => {
        // Only handle actual errors, not user cancellation
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Refer a Friend</h1>

        {/* Main Offer Card */}
        <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-[#E7E2D9] shadow-sm">
          <GiftIcon className="h-16 w-16 mx-auto text-[#C8996A] mb-4" />
          <div className="mb-4">
            <h2 className="font-heading font-serif text-3xl sm:text-4xl text-[#1A1A1A] mb-1">
              Get 25% OFF
            </h2>
            <p className="text-2xl text-[#1A1A1A] font-normal">
              Your Next Order
            </p>
          </div>
          <p className="text-base text-[#6B6862] max-w-md mx-auto leading-relaxed">
            Share your referral code with friends and both of you will receive 25% off your next order!
          </p>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-xl p-6 border border-[#E7E2D9] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] text-center mb-4">Your Referral Code</h3>
          <div className="bg-[#FAF8F5] border border-[#E7E2D9] rounded-lg p-4 flex items-center justify-center gap-4">
            <span className="text-2xl font-bold tracking-widest text-[#1A1A1A]">{referralCode}</span>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-[#E7E2D9] rounded-lg transition"
              title="Copy code"
            >
              {copied ? (
                <CheckIcon className="h-6 w-6 text-[#C8996A]" />
              ) : (
                <DocumentDuplicateIcon className="h-6 w-6 text-[#8C827A]" />
              )}
            </button>
          </div>
          <button
            onClick={shareReferralCode}
            className="w-full mt-4 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 px-6 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
          >
            <ShareIcon className="h-5 w-5" />
            Share Code
          </button>
        </div>

        {/* Referral Stats */}
        {(referralCount > 0 || referralCredits > 0) && (
          <div className="bg-white rounded-xl p-6 border border-[#E7E2D9] shadow-sm">
            <h3 className="text-lg font-bold text-[#1A1A1A] text-center mb-6">Your Referral Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl">
                <p className="text-3xl font-bold text-[#C8996A]">{referralCount}</p>
                <p className="text-xs font-medium text-[#6B6862] uppercase tracking-wider mt-1">Friends Referred</p>
              </div>
              <div className="text-center p-4 bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl">
                <p className="text-3xl font-bold text-[#C8996A]">{referralCredits}</p>
                <p className="text-xs font-medium text-[#6B6862] uppercase tracking-wider mt-1">Discounts Available</p>
              </div>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="bg-white rounded-xl p-6 border border-[#E7E2D9] shadow-sm">
          <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">How it works:</h3>
          <div className="space-y-4">
            <StepWidget number="1" text="Share your unique referral code with friends" />
            <StepWidget number="2" text="Your friend signs up using your code" />
            <StepWidget number="3" text="Both of you get 25% off your next order" />
            <StepWidget number="4" text="No limit on referrals - share with everyone!" />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function StepWidget({ number, text }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-[#FAF8F5] border border-[#E7E2D9] text-[#C8996A] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
        {number}
      </div>
      <p className="text-sm text-[#353535]">{text}</p>
    </div>
  );
}