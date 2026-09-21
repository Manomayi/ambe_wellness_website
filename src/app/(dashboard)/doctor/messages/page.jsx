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
import { ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';

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
      <div className="space-y-4 max-w-4xl mx-auto select-none">
        {/* Top Header matching Flutter MessagesPage */}
        <div className="pt-1 pb-1">
          <h1 className="text-2xl sm:text-3xl font-heading text-white font-normal tracking-tight">
            Messages
          </h1>
        </div>

        {chats.length === 0 ? (
          <div className="bg-[#2D2D30] border border-white/10 rounded-[20px] p-12 text-center shadow-lg">
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
                  className={`bg-[#2D2D30] border ${
                    isUnread
                      ? 'border-[#FFD3AC]/30'
                      : 'border-white/5'
                  } rounded-[20px] p-4 sm:p-4.5 transition-all duration-150 hover:bg-[#353539] cursor-pointer shadow-md`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* User Avatar matching Flutter */}
                    <div className="w-[52px] h-[52px] rounded-full overflow-hidden border-2 border-[#FFD3AC]/30 bg-[#3D3D42] flex items-center justify-center shrink-0">
                      {chat.user_photo_url ? (
                        <img
                          src={chat.user_photo_url}
                          alt={chat.user_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement.innerHTML = '<svg class="w-6 h-6 text-[#FFD3AC]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                          }}
                        />
                      ) : (
                        <UserIcon className="w-6 h-6 text-[#FFD3AC]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base text-white font-semibold font-sans truncate">
                        {chat.user_name}
                      </h3>
                      <p className="text-sm text-gray-400 font-sans truncate mt-0.5">
                        {isYou && <span className="text-[#FFD3AC]">You: </span>}
                        {chat.last_message || 'New patient matched'}
                      </p>
                    </div>

                    {/* Right column: Timestamp & Bottom-aligned Unread Dot */}
                    <div className="flex flex-col items-end justify-center shrink-0 pl-2">
                      <span className="text-xs text-gray-400 font-medium font-sans">
                        {formatTimestamp(lastTimestamp)}
                      </span>
                      {isUnread ? (
                        <span className="w-2 h-2 bg-[#FFD3AC] rounded-full mt-2 self-end shadow-[0_0_6px_rgba(255,211,172,0.6)]"></span>
                      ) : (
                        <span className="w-2 h-2 mt-2"></span>
                      )}
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