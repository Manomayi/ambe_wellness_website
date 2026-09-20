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
        if (error?.code === 'permission-denied') return;
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
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-2 border-[#FFD3AC] border-t-transparent"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="doctor">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal">Messages</h1>
            <p className="text-sm text-gray-400 mt-1 font-sans">
              Patient conversations and consultation message channels
            </p>
          </div>
          {chats.length > 0 && (
            <span className="text-xs bg-[#2D2D30] text-[#FFD3AC] px-3.5 py-1.5 rounded-full font-semibold border border-white/10 font-sans">
              {chats.length} {chats.length === 1 ? 'patient' : 'patients'}
            </span>
          )}
        </div>

        {chats.length === 0 ? (
          <div className="bg-[#1B1A18]/80 border border-white/10 rounded-2xl p-12 text-center shadow-lg">
            <ChatBubbleLeftRightIcon className="h-14 w-14 text-gray-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1 font-sans">No Messages Yet</h3>
            <p className="text-gray-400 max-w-sm mx-auto text-sm font-sans">
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
                  className={`group relative bg-[#1B1A18]/80 border ${
                    isUnread
                      ? 'border-[#FFD3AC] ring-1 ring-[#FFD3AC]/40'
                      : 'border-white/10 hover:border-[#FFD3AC]/40'
                  } rounded-2xl p-4 sm:p-5 transition-all duration-150 hover:shadow-lg cursor-pointer`}
                >
                  <div className="flex items-center gap-4">
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#FFD3AC] bg-[#2D2D30] flex items-center justify-center">
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
                          <UserIcon className="w-6 h-6 text-[#FFD3AC]" />
                        )}
                      </div>
                      {isUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#FFD3AC] border-2 border-[#1E1E1E] rounded-full shadow-xs"></span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className={`text-base truncate font-sans ${
                          isUnread ? 'font-bold text-white' : 'font-semibold text-white'
                        }`}>
                          {chat.user_name}
                        </h3>
                        <span className="text-xs text-gray-400 shrink-0 font-medium font-sans">
                          {formatTimestamp(lastTimestamp)}
                        </span>
                      </div>

                      {/* Message preview */}
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className={`text-sm truncate font-sans ${
                          isUnread ? 'text-white font-medium' : 'text-gray-400'
                        }`}>
                          {isYou && <span className="text-[#FFD3AC] font-normal">You: </span>}
                          {chat.last_message || 'New patient matched'}
                        </p>

                        {/* Unread indicator dot matching mobile app */}
                        {isUnread && (
                          <span className="w-2.5 h-2.5 bg-[#FFD3AC] rounded-full shrink-0 shadow-xs"></span>
                        )}
                      </div>

                      {/* Status subtitle */}
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 font-sans">
                        {chat.is_first_consultation_completed ? (
                          <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                            Active Patient
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[11px] text-[#FFD3AC] font-medium">
                            <ExclamationCircleIcon className="w-3.5 h-3.5 mr-1 text-[#FFD3AC]" />
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