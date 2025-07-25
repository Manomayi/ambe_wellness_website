"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc,
  serverTimestamp,
  writeBatch,
  where,
  getDocs,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

export default function ChatWindow({ 
  chatId, 
  recipientName, 
  recipientId,
  canSendMessage,
  isDoctor 
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user) return;

    // Subscribe to messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      scrollToBottom();
      
      // Mark messages as read
      if (msgs.length > 0) {
        markMessagesAsRead(msgs);
      }
    });
    
    return () => unsubscribe();
  }, [chatId, user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async (messagesToMark) => {
    try {
      const batch = writeBatch(db);
      let hasUnreadMessages = false;
      
      // Update unread messages
      messagesToMark
        .filter(msg => msg.sender_uid !== user?.uid && !msg.read)
        .forEach(msg => {
          const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
          batch.update(msgRef, { read: true });
          hasUnreadMessages = true;
        });
      
      // Reset unread count in chat metadata for doctor
      if (hasUnreadMessages && isDoctor) {
        const chatRef = doc(db, 'doctors', user.uid, 'chats', chatId);
        batch.update(chatRef, { unread_count: 0 });
      }
      
      if (hasUnreadMessages) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !canSendMessage) return;
    
    setSending(true);
    const messageText = newMessage;
    setNewMessage('');
    
    try {
      // Add message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: messageText,
        sender_uid: user.uid,
        timestamp: serverTimestamp(),
        read: false,
      });
      
      // Update chat metadata
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        last_message: messageText,
        last_message_time: serverTimestamp(),
      });
      
      // Update doctor's chat metadata if user is sending
      if (!isDoctor) {
        const doctorChatRef = doc(db, 'doctors', recipientId, 'chats', chatId);
        await updateDoc(doctorChatRef, {
          last_message: messageText,
          last_message_time: serverTimestamp(),
          unread_count: increment(1),
        });
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold">{recipientName}</h3>
        {!canSendMessage && !isDoctor && (
          <p className="text-sm text-gray-500">
            You can message after your first consultation
          </p>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="text-center mb-4">
              <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            {dateMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_uid === user?.uid}
                time={formatTime(message.timestamp)}
              />
            ))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      {canSendMessage ? (
        <form onSubmit={sendMessage} className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t bg-gray-50 text-center text-gray-500">
          {isDoctor ? 'This conversation is locked' : 'Complete your first consultation to start messaging'}
        </div>
      )}
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, isOwn, time }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isOwn
            ? 'bg-green-600 text-white rounded-br-sm'
            : 'bg-gray-200 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p className={`text-xs mt-1 ${isOwn ? 'text-green-100' : 'text-gray-500'}`}>
          {time}
        </p>
      </div>
    </div>
  );
}