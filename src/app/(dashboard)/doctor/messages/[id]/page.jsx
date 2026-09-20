"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ChatWindow from '@/components/chat/ChatWindow';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserIcon } from '@heroicons/react/24/outline';
import AmbeBackButton from '@/components/common/AmbeBackButton';

export default function DoctorChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const userNameQuery = searchParams.get('userName');
  const chatId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    if (user && chatId) {
      loadChatData();
    }
  }, [user, chatId]);

  const loadChatData = async () => {
    if (!user || !chatId) return;
    try {
      // 1. Try to get chat metadata from doctor's subcollection
      const chatMetaDoc = await getDoc(
        doc(db, 'doctors', user.uid, 'chats', chatId)
      );
      
      let metaData = {};
      if (chatMetaDoc.exists()) {
        metaData = chatMetaDoc.data();
      }

      // Mark as read by doctor immediately upon opening
      try {
        await setDoc(
          doc(db, 'doctors', user.uid, 'chats', chatId),
          { last_message_read_by_doctor: true, unread_count: 0 },
          { merge: true }
        );
      } catch (e) {
        // Non-critical, continue
      }
      
      const targetUserId =
        metaData.user_uid ||
        metaData.user_id ||
        (chatId.includes('_') ? chatId.split('_')[0] : '');
      
      let userData = null;
      if (targetUserId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', targetUserId));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (err) {
          console.warn('Could not fetch user profile:', err);
        }
      }
      
      const resolvedUserName =
        metaData.user_name ||
        userData?.name ||
        userData?.displayName ||
        userNameQuery ||
        'User';
        
      const userPhotoUrl =
        metaData.user_photo_url ||
        userData?.photoURL ||
        userData?.profile_image_url ||
        null;

      setChatData({
        chatId: chatId,
        userId: targetUserId,
        userName: resolvedUserName,
        userPhotoUrl: userPhotoUrl,
        userProfile: userData,
        isFirstConsultationCompleted:
          metaData.is_first_consultation_completed ??
          userData?.is_first_consultation_completed ??
          false,
      });
    } catch (error) {
      console.error('Error loading chat data:', error);
      // Fallback so doctor is never blocked from chatting
      const fallbackUserId = chatId.includes('_') ? chatId.split('_')[0] : '';
      setChatData({
        chatId: chatId,
        userId: fallbackUserId,
        userName: userNameQuery || 'User',
        userPhotoUrl: null,
        userProfile: null,
        isFirstConsultationCompleted: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!chatData) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="max-w-md mx-auto p-6 text-center mt-20">
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-4">Chat Not Found</h2>
            <button
              onClick={() => router.push('/doctor/messages')}
              className="bg-[#FFD3AC] text-[#1E1E1E] font-semibold px-6 py-2.5 rounded-full hover:bg-[#ffe0c4] transition"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Doctor can always send messages
  const canSendMessage = true;

  return (
    <ProtectedRoute userType="doctor">
      <div className="h-screen flex flex-col bg-transparent">
        {/* Header */}
        <div className="bg-[#1E1E1E]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <AmbeBackButton onClick={() => router.push('/doctor/messages')} />
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FFD3AC]/60 bg-black/30 flex items-center justify-center shrink-0">
              {chatData.userPhotoUrl ? (
                <img
                  src={chatData.userPhotoUrl}
                  alt={chatData.userName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = '<span class="text-base">👤</span>';
                  }}
                />
              ) : (
                <UserIcon className="w-5 h-5 text-[#FFD3AC]" />
              )}
            </div>
            <div>
              <h1 className="text-base font-semibold text-white leading-tight">
                {chatData.userName}
              </h1>
              <p className="text-xs text-white/60">
                {chatData.isFirstConsultationCompleted 
                  ? 'Active Patient' 
                  : 'Pending First Consultation'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            chatId={chatId}
            recipientName={chatData.userName}
            recipientId={chatData.userId}
            canSendMessage={canSendMessage}
            isDoctor={true}
            hideHeader={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}