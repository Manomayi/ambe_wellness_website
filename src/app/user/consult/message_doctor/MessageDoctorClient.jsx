"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ChatWindow from '@/components/chat/ChatWindow';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function MessageDoctorClient() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.doctor) {
      initializeChat();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const initializeChat = async () => {
    try {
      // Generate consistent chat ID
      const ids = [user.uid, profile.doctor.uid].sort();
      const chatId = `${ids[0]}_${ids[1]}`;
      
      // Check if chat exists
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      
      if (!chatDoc.exists()) {
        // Create chat document
        await setDoc(doc(db, 'chats', chatId), {
          participants: [user.uid, profile.doctor.uid],
          participant_names: {
            [user.uid]: `${profile.first_name} ${profile.last_name}`,
            [profile.doctor.uid]: `Dr. ${profile.doctor.first_name} ${profile.doctor.last_name}`
          },
          created_at: serverTimestamp(),
          last_message: null,
          last_message_time: null
        });

        // Create chat metadata for doctor
        await setDoc(doc(db, 'doctors', profile.doctor.uid, 'chats', chatId), {
          user_uid: user.uid,
          user_name: `${profile.first_name} ${profile.last_name}`,
          unread_count: 0,
          last_message: null,
          last_message_time: null
        });
      }
      
      setChatId(chatId);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSendMessage = profile?.is_first_consultation_completed || false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile?.doctor) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center h-screen flex items-center justify-center">
        <div>
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Healthcare Provider Assigned</h2>
          <p className="text-gray-600 mb-6">
            You need to be matched with a healthcare provider before you can send messages.
          </p>
          <button
            onClick={() => router.push('/user/get-matched')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Get Matched Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center">
        <button
          onClick={() => router.push('/user/consult')}
          className="mr-4 text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold">
          Message Dr. {profile.doctor.first_name} {profile.doctor.last_name}
        </h1>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-hidden">
        {chatId && (
          <ChatWindow
            chatId={chatId}
            recipientName={`Dr. ${profile.doctor.first_name} ${profile.doctor.last_name}`}
            recipientId={profile.doctor.uid}
            canSendMessage={canSendMessage}
            isDoctor={false}
          />
        )}
      </div>
    </div>
  );
}