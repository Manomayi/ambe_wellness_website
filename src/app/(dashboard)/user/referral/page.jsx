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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">Refer a Friend</h1>

        {/* Main Offer Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="text-center space-y-4">
            <GiftIcon className="h-20 w-20 mx-auto" />
            <div>
              <h2 className="text-4xl font-bold">Get 25% OFF</h2>
              <p className="text-2xl">Your Next Order</p>
            </div>
            <p className="text-lg max-w-md mx-auto">
              Share your referral code with friends and both of you will receive 25% off your next order!
            </p>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 text-center mb-4">Your Referral Code</h3>
          <div className="bg-white rounded-lg p-4 flex items-center justify-center gap-4">
            <span className="text-2xl font-bold tracking-wider text-gray-900">{referralCode}</span>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Copy code"
            >
              {copied ? (
                <CheckIcon className="h-6 w-6 text-green-600" />
              ) : (
                <DocumentDuplicateIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
          <button
            onClick={shareReferralCode}
            className="w-full mt-4 bg-green-600 text-white py-3 px-6 rounded-full hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <ShareIcon className="h-5 w-5" />
            Share Code
          </button>
        </div>

        {/* Referral Stats */}
        {(referralCount > 0 || referralCredits > 0) && (
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Your Referral Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{referralCount}</p>
                <p className="text-gray-600">Friends Referred</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{referralCredits}</p>
                <p className="text-gray-600">Discounts Available</p>
              </div>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4">How it works:</h3>
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
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
        {number}
      </div>
      <p className="text-gray-700">{text}</p>
    </div>
  );
}