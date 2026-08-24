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
  isDoctor,
  hideHeader = false 
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
        batch.update(chatRef, { 
          unread_count: 0,
          last_message_read_by_doctor: true 
        });
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
        last_message_sender_uid: user.uid,
      });
      
      // Update doctor's chat metadata if user is sending
      if (!isDoctor && recipientId) {
        const doctorChatRef = doc(db, 'doctors', recipientId, 'chats', chatId);
        await updateDoc(doctorChatRef, {
          last_message: messageText,
          last_message_sender_uid: user.uid,
          last_message_timestamp: serverTimestamp(),
          last_message_time: serverTimestamp(),
          last_message_read_by_doctor: false,
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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
    <div className="flex flex-col h-full bg-[#FAF8F5]">
      {/* Optional Inner Header */}
      {!hideHeader && (
        <div className="p-4 border-b border-[#E7E2D9] bg-white">
          <h3 className="font-semibold text-sm text-[#1A1A1A]">{recipientName}</h3>
          {!canSendMessage && !isDoctor && (
            <p className="text-xs text-[#8C827A] mt-0.5">
              Messaging is enabled after completing your first consultation
            </p>
          )}
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FAF8F5]">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-6">
            <div className="bg-white border border-[#E7E2D9] rounded-2xl p-6 max-w-sm">
              <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Direct Message Channel</p>
              <p className="text-xs text-[#6B6862]">
                {canSendMessage
                  ? 'Send a message to begin your conversation with your doctor.'
                  : 'Complete your first video consultation to unlock direct messaging with your doctor.'}
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="text-center my-3">
                <span className="text-[11px] font-medium text-[#6B6862] bg-white border border-[#E7E2D9] px-3 py-1 rounded-full shadow-2xs">
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
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      {canSendMessage ? (
        <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-[#E7E2D9] bg-white">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
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
              placeholder="Type your message..."
              className="flex-1 p-3 text-sm bg-[#FAF8F5] border border-[#E7E2D9] rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FFD3AC] focus:border-[#C8996A] text-[#1A1A1A] placeholder-[#8C827A]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3.5 bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-[#E7E2D9] bg-white text-center">
          <p className="text-xs text-[#6B6862] font-medium">
            {isDoctor 
              ? 'This conversation is currently locked' 
              : 'Complete your first consultation to start messaging with your doctor.'}
          </p>
        </div>
      )}
    </div>
  );
}

// Message Bubble Component with Ambé Theme
function MessageBubble({ message, isOwn, time }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2.5`}>
      <div
        className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 shadow-2xs ${
          isOwn
            ? 'bg-[#FFD3AC] text-[#1A1A1A] rounded-2xl rounded-br-xs'
            : 'bg-white text-[#1A1A1A] border border-[#E7E2D9] rounded-2xl rounded-bl-xs'
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed font-normal">
          {message.text}
        </p>
        <p
          className={`text-[10px] mt-1 font-medium ${
            isOwn ? 'text-[#8C827A] text-right' : 'text-[#8C827A]'
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}