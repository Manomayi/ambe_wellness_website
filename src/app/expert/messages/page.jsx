'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ExpertMessagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (!user) {
        router.push('/login');
        return;
      }
      // subscribe to this expert's chats
      const q = query(
        collection(db, 'doctors', user.uid, 'chats'),
        orderBy('last_message_timestamp', 'desc')
      );
      const unsubSnap = onSnapshot(q, snap => {
        const list = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            chatId: d.chat_id,
            memberName: d.member_name,
            memberPhotoUrl: d.member_photo_url,
            lastMessage: d.last_message,
            lastTimestamp: d.last_message_timestamp,
            lastFromMember: d.last_message_sender_uid !== user.uid,
            read: d.last_message_read_by_expert
          };
        });
        setChats(list);
        setLoading(false);
      }, err => {
        console.error('Chats snapshot error', err);
        setLoading(false);
      });
      return () => unsubSnap();
    });
    return () => unsubAuth();
  }, [router]);

  const formatTimestamp = ts => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = (day - msgDay) / 86400000;

    if (diff === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString(undefined, { weekday: 'long' });
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <h1 className="text-2xl font-semibold text-gray-800">Messages</h1>

      {chats.length === 0 ? (
        <p className="text-gray-600">No chats yet.</p>
      ) : (
        <div className="space-y-4">
          {chats.map(c => {
            const prefix = c.lastFromMember ? '' : 'You: ';
            return (
              <button
                key={c.id}
                onClick={() => {
                  const params = new URLSearchParams({
                    chatId: c.chatId,
                    memberName: c.memberName,
                    memberPhotoUrl: c.memberPhotoUrl || ''
                  });
                  router.push(`/expert/messages/chat?${params.toString()}`);
                }}
                className="w-full bg-white shadow rounded-lg border-l-4 border-green-600 p-4 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-800">{c.memberName}</p>
                  <p className="text-gray-600 text-sm text-left mt-1 truncate">
                    {prefix}{c.lastMessage}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <p className={`text-xs ${
                    c.read ? 'text-gray-500' : 'font-bold text-gray-800'
                  }`}>
                    {formatTimestamp(c.lastTimestamp)}
                  </p>
                  {!c.read && <span className="h-2 w-2 bg-blue-500 rounded-full" />}
                  <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}