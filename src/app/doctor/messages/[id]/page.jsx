"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatWindow from '@/components/chat/ChatWindow';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ExpertChatPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const userName = searchParams.get('userName');

  useEffect(() => {
    if (user && params.id) {
      loadChatData();
    }
  }, [user, params.id]);

  const loadChatData = async () => {
    try {
      // Get chat metadata
      const chatMetaDoc = await getDoc(
        doc(db, 'doctors', user.uid, 'chats', params.id)
      );
      
      if (chatMetaDoc.exists()) {
        const metaData = chatMetaDoc.data();
        
        // Get user profile
        const userDoc = await getDoc(doc(db, 'users', metaData.user_uid));
        const userData = userDoc.data();
        
        setChatData({
          chatId: params.id,
          userId: metaData.user_uid,
          userName: metaData.user_name,
          userProfile: userData
        });
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
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

  if (!chatData) {
    return (
      <ProtectedRoute userType="doctor">
        <div className="max-w-4xl mx-auto p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat Not Found</h2>
          <button
            onClick={() => router.push('/doctor/messages')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Back to Messages
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  // Doctor can always send messages
  const canSendMessage = true;

  return (
    <ProtectedRoute userType="doctor">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center">
          <button
            onClick={() => router.push('/doctor/messages')}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {chatData.userName || userName}
            </h1>
            {chatData.userProfile && (
              <p className="text-sm text-gray-500">
                {chatData.userProfile.is_first_consultation_completed 
                  ? 'Active User' 
                  : 'Pending First Consultation'}
              </p>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            chatId={params.id}
            recipientName={chatData.userName}
            recipientId={chatData.userId}
            canSendMessage={canSendMessage}
            isDoctor={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}