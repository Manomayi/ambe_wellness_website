'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function MessageExpertPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expertUid = searchParams.get('expertUid');
  const expertName = searchParams.get('expertName');
  const expertPhotoUrl = searchParams.get('expertPhotoUrl');

  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    console.log('MESSAGESSSSSSSS111111');

    const unsubAuth = onAuthStateChanged(auth, current => {
        console.log('MESSAGESSSSSSSS222222');

      if (!current) {
        console.log('MESSAGESSSSSSSS3333333333');

        router.push('/login');
        return;
      }
      setUser(current);
      if (expertUid) {
        console.log('MESSAGESSSSSSSS4444444');

        const chatId = `${current.uid}_${expertUid}`;
        const q = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'asc')
        );
        const unsubSnap = onSnapshot(q, snap => {
          const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('MESSAGESSSSSSSS');
          console.log('Received messages:', msgs); 
          setMessages(msgs);
          setTimeout(
            () => endRef.current?.scrollIntoView({ behavior: 'smooth' }),
            50
          );
        });
        return unsubSnap;
      }
    });
    return () => unsubAuth();
  }, [expertUid, router]);

  const handleSend = async () => {
    if (!text.trim() || !user || !expertUid) return;
    setSending(true);
    const chatId = `${user.uid}_${expertUid}`;
    const col = collection(db, 'chats', chatId, 'messages');
    await addDoc(col, {
      sender_uid: user.uid,
      text: text.trim(),
      timestamp: serverTimestamp(),
    });
    setText('');
    setSending(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        {expertPhotoUrl && (
          <img
            src={expertPhotoUrl}
            alt={expertName || ''}
            className="h-10 w-10 rounded-full mx-3 object-cover"
          />
        )}
        <h1 className="text-lg font-medium text-gray-800">
          {expertName}
        </h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isUser = msg.sender_uid === user?.uid;
          const time = msg.timestamp?.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }) || '';
          return (
            <div
              key={msg.id}
              className={`mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  isUser ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-800'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p className="text-xs mt-1 text-gray-200 text-right">{time}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white flex items-center">
        <textarea
          rows={1}
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 resize-none p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className={`ml-3 p-3 rounded-full text-white shadow ${
            sending ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <PaperAirplaneIcon className="h-5 w-5 transform rotate-90" />
        </button>
      </div>
    </div>
  );
}
