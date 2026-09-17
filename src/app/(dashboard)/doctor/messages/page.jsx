"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { 
  collection, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChatBubbleLeftRightIcon, UserIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function DoctorMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to all chats for this doctor without orderBy to avoid excluding documents
    // that use `last_message_timestamp` instead of `last_message_time`.
    const chatsRef = collection(db, 'doctors', user.uid, 'chats');

    const unsubscribe = onSnapshot(
      chatsRef,
      async (snapshot) => {
        try {
          const chatsList = await Promise.all(
            snapshot.docs.map(async (chatDoc) => {
              const chatData = chatDoc.data();
              const targetUserUid =
                chatData.user_uid ||
                chatData.user_id ||
                (chatDoc.id.includes('_') ? chatDoc.id.split('_')[0] : null);

              let userProfile = null;
              if (targetUserUid) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', targetUserUid));
                  if (userDoc.exists()) {
                    userProfile = userDoc.data();
                  }
                } catch (e) {
                  // Fallback to chatDoc metadata if user profile read is restricted
                }
              }

              const userName =
                chatData.user_name ||
                userProfile?.name ||
                userProfile?.displayName ||
                'Unknown User';

              const userPhotoUrl =
                chatData.user_photo_url ||
                userProfile?.photoURL ||
                userProfile?.profile_image_url ||
                null;

              const isFirstConsultationCompleted =
                chatData.is_first_consultation_completed ??
                userProfile?.is_first_consultation_completed ??
                false;

              return {
                id: chatDoc.id,
                ...chatData,
                user_uid: targetUserUid,
                user_name: userName,
                user_photo_url: userPhotoUrl,
                is_first_consultation_completed: isFirstConsultationCompleted,
                user_profile: userProfile,
              };
            })
          );

          // Sort descending by latest message timestamp (supporting both naming conventions)
          const getTimestampMillis = (item) => {
            const ts =
              item.last_message_timestamp ||
              item.last_message_time ||
              item.created_at;
            if (!ts) return 0;
            if (typeof ts.toMillis === 'function') return ts.toMillis();
            if (ts.seconds) return ts.seconds * 1000;
            if (ts instanceof Date) return ts.getTime();
            if (typeof ts === 'number') return ts;
            return 0;
          };

          chatsList.sort((a, b) => getTimestampMillis(b) - getTimestampMillis(a));

          setChats(chatsList);
        } catch (err) {
          console.error('Error processing doctor chats:', err);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching doctor chats:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Formats timestamp matching mobile app logic: '5:57 PM', 'Yesterday', 'Monday', or 'Aug 23'
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if ((today - messageDate) / (1000 * 60 * 60 * 24) < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (now.getFullYear() === date.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const handleChatClick = (chat) => {
    router.push(`/doctor/messages/${chat.id}?userName=${encodeURIComponent(chat.user_name)}`);
  };

  if (loading) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C8996A]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="doctor">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1A1A1A]">Messages</h1>
            <p className="text-sm text-[#6B6862] mt-1">
              Patient conversations and consultation message channels
            </p>
          </div>
          {chats.length > 0 && (
            <span className="text-xs bg-[#F4F1EA] text-[#6B6862] px-3 py-1.5 rounded-full font-medium border border-[#E7E2D9]">
              {chats.length} {chats.length === 1 ? 'patient' : 'patients'}
            </span>
          )}
        </div>

        {chats.length === 0 ? (
          <div className="bg-white border border-[#E7E2D9] rounded-2xl p-12 text-center shadow-xs">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-[#8C827A] mx-auto mb-4" />
            <h3 className="text-xl font-medium text-[#353535] mb-2">No Messages Yet</h3>
            <p className="text-[#6B6862] max-w-sm mx-auto text-sm">
              Your patient conversations will appear here once you start messaging with them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => {
              const lastTimestamp =
                chat.last_message_timestamp ||
                chat.last_message_time ||
                chat.created_at;
              const isYou = chat.last_message_sender_uid === user?.uid;
              const isUnread = chat.last_message_read_by_doctor === false;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatClick(chat)}
                  className={`group relative bg-white border ${
                    isUnread
                      ? 'border-[#FFD3AC] ring-1 ring-[#FFD3AC]/50'
                      : 'border-[#E7E2D9] hover:border-[#C8996A]/40'
                  } rounded-2xl p-4 sm:p-5 transition-all duration-150 hover:shadow-md cursor-pointer`}
                >
                  <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-[#FFD3AC]/40 bg-[#FAF8F5] flex items-center justify-center">
                        {chat.user_photo_url ? (
                          <img
                            src={chat.user_photo_url}
                            alt={chat.user_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement.innerHTML = '<span class="text-xl">👤</span>';
                            }}
                          />
                        ) : (
                          <UserIcon className="w-6 h-6 text-[#8C827A]" />
                        )}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FFD3AC] border-2 border-white rounded-full shadow-xs"></span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className={`text-base truncate ${
                          isUnread ? 'font-bold text-[#1A1A1A]' : 'font-semibold text-[#1A1A1A]'
                        }`}>
                          {chat.user_name}
                        </h3>
                        <span className="text-xs text-[#8C827A] shrink-0 font-medium">
                          {formatTimestamp(lastTimestamp)}
                        </span>
                      </div>

                      {/* Message preview */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className={`text-sm truncate ${
                          isUnread ? 'text-[#1A1A1A] font-medium' : 'text-[#6B6862]'
                        }`}>
                          {isYou && <span className="text-[#8C827A] font-normal">You: </span>}
                          {chat.last_message || 'New patient matched'}
                        </p>

                        {/* Unread indicator dot matching mobile app */}
                        {isUnread && (
                          <span className="w-2.5 h-2.5 bg-[#FFD3AC] rounded-full shrink-0 shadow-xs"></span>
                        )}
                      </div>

                      {/* Status subtitle */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-[#8C827A]">
                        {chat.is_first_consultation_completed ? (
                          <span className="inline-flex items-center text-[11px] text-[#4A6B4A] font-medium">
                            <span className="w-1.5 h-1.5 bg-[#4A6B4A] rounded-full mr-1.5"></span>
                            Active Patient
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] text-[#A67C52] font-medium">
                            <ExclamationCircleIcon className="w-3 h-3 mr-1 text-[#A67C52]" />
                            Pending First Consultation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}