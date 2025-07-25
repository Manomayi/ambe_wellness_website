"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChatBubbleLeftRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function DoctorMessagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to all chats for this doctor
    const chatsQuery = query(
      collection(db, 'doctors', user.uid, 'chats'),
      orderBy('last_message_time', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsList = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          
          // Get user profile for additional info
          const userDoc = await getDoc(doc(db, 'users', chatData.user_uid));
          const userData = userDoc.data();
          
          return {
            id: chatDoc.id,
            ...chatData,
            user_profile: userData
          };
        })
      );
      
      setChats(chatsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) return 'Just now';
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleChatClick = (chat) => {
    router.push(`/doctor/messages/${chat.id}?userName=${encodeURIComponent(chat.user_name)}`);
  };

  if (loading) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="doctor">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Messages</h1>

        {chats.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Messages Yet</h3>
            <p className="text-gray-600">
              Messages from your users will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow divide-y">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition"
              >
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {chat.user_name}
                        </h3>
                        {chat.last_message && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {chat.last_message}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {chat.last_message_time && (
                          <p className="text-xs text-gray-500">
                            {formatTime(chat.last_message_time)}
                          </p>
                        )}
                        {chat.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-600 text-white text-xs rounded-full mt-1">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* User info */}
                    {chat.user_profile && (
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        {chat.user_profile.is_first_consultation_completed ? (
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            Active User
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                            Pending First Consultation
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}