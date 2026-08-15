'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import BackButton from '@/components/common/BackButton';
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  'General Question',
  'Billing & Payment',
  'Technical Support',
  'Feedback & Suggestions',
];

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openTicket, setOpenTicket] = useState(null);
  const [ticketLoading, setTicketLoading] = useState(true);

  // Form state for creating a ticket
  const [selectedCategory, setSelectedCategory] = useState('General Question');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // 1. Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/login');
      } else {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  // 2. Real-time listener for open tickets
  useEffect(() => {
    if (!user) return;

    const ticketsQuery = query(
      collection(db, 'tickets'),
      where('userId', '==', user.uid),
      where('status', '==', 'open'),
      limit(1)
    );

    const unsubTickets = onSnapshot(
      ticketsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          setOpenTicket({ id: docSnap.id, ...docSnap.data() });
        } else {
          setOpenTicket(null);
        }
        setTicketLoading(false);
      },
      (error) => {
        console.error('Error fetching ticket:', error);
        setTicketLoading(false);
      }
    );

    return () => unsubTickets();
  }, [user]);

  // 3. Create Ticket function
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmed = description.trim();
    if (!trimmed) {
      setFormError('Please enter a description');
      return;
    }
    if (trimmed.length < 5) {
      setFormError('Description must be at least 5 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user) return;

      // Fetch user profile info from users collection
      let userName = user.displayName || 'there';
      let profilePicture = user.photoURL || null;

      try {
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          userName = uData.first_name || uData.name || user.displayName || 'there';
          profilePicture = uData.profile_picture || uData.photoURL || profilePicture;
        }
      } catch (err) {
        console.warn('Could not fetch extra user info:', err);
      }

      // Create Ticket Document
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        userRole: 'user',
        category: selectedCategory,
        status: 'open',
        createdAt: serverTimestamp(),
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
        botWelcomeSent: true,
        userInfo: {
          name: userName,
          email: user.email || '',
          profilePicture: profilePicture || '',
        },
      });

      // Add Initial User Message
      await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
        content: trimmed,
        senderId: user.uid,
        senderRole: 'user',
        timestamp: serverTimestamp(),
      });

      // Automated Bot welcome reply
      setTimeout(async () => {
        try {
          const botMessage =
            '👋 Hello! Thanks for reaching out to support. Our team has received your ticket and will assist you shortly. Please feel free to share any additional details.';

          await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
            content: botMessage,
            senderId: 'bot',
            senderRole: 'bot',
            timestamp: serverTimestamp(),
          });

          await updateDoc(doc(db, 'tickets', ticketRef.id), {
            lastMessage: botMessage,
            lastMessageAt: serverTimestamp(),
            lastMessageSenderId: 'bot',
          });
        } catch (botErr) {
          console.error('Error sending bot message:', botErr);
        }
      }, 800);

      setDescription('');
    } catch (error) {
      console.error('Error creating ticket:', error);
      setFormError('Error creating ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || ticketLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-10 w-10 border-2 border-[#C8996A] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <BackButton />

      {openTicket ? (
        <SupportChatView ticket={openTicket} user={user} />
      ) : (
        <div className="bg-white border border-[#E7E2D9] rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="text-center max-w-lg mx-auto mb-8">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E7E2D9] flex items-center justify-center mx-auto mb-4 text-[#C8996A]">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2">
              How can we help you?
            </h1>
            <p className="text-sm text-[#6B6862]">
              Create a support ticket and our team will respond as soon as possible.
            </p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-6 max-w-lg mx-auto">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {formError}
              </div>
            )}

            {/* Topic Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
                Select Topic
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none bg-[#FAF8F5] border border-[#E7E2D9] rounded-xl px-4 py-3 text-sm text-[#1A1A1A] font-medium focus:outline-none focus:border-[#C8996A] pr-10 cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#8C827A]">
                  <ChevronDownIcon className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#1A1A1A]">
                  Description
                </label>
                <span className="text-xs text-[#8C827A]">
                  {description.length}/120
                </span>
              </div>
              <textarea
                rows={5}
                maxLength={120}
                placeholder="Describe your issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 border border-[#E7E2D9] bg-[#FAF8F5] text-sm text-[#1A1A1A] rounded-xl focus:outline-none focus:border-[#C8996A] placeholder-[#8C827A] resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting Ticket…' : 'SUBMIT TICKET'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Support Chat Component
function SupportChatView({ ticket, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Real-time messages stream
  useEffect(() => {
    if (!ticket?.id) return;

    const msgsQuery = query(
      collection(db, 'tickets', ticket.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(msgsQuery, (snapshot) => {
      const msgs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setMessages(msgs);
    });

    return () => unsub();
  }, [ticket?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = newMessage.trim();
    if (trimmed.length < 5) {
      alert('Message must be at least 5 characters');
      return;
    }

    setSending(true);
    setNewMessage('');

    try {
      await addDoc(collection(db, 'tickets', ticket.id, 'messages'), {
        content: trimmed,
        senderId: user.uid,
        senderRole: 'user',
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, 'tickets', ticket.id), {
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
      });
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-[#E7E2D9] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[700px]">
      {/* Header */}
      <div className="bg-[#FAF8F5] border-b border-[#E7E2D9] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-bold text-base text-[#1A1A1A]">
            {ticket.category || 'Support'}
          </h2>
          <p className="text-xs text-[#8C827A] mt-0.5">
            Ticket #{ticket.id.substring(0, 6)}
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFD3AC]/40 text-[#8C5E2D] border border-[#FFD3AC]">
          OPEN
        </span>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FAF8F5]/50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-[#8C827A]">
            No messages yet
          </div>
        ) : (
          messages.map((msg) => {
            const senderRole = msg.senderRole || 'user';
            const isBot = senderRole === 'bot';
            const isMe = senderRole !== 'admin' && !isBot;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl p-4 text-sm shadow-sm ${
                    isMe
                      ? 'bg-[#FFD3AC] text-[#1A1A1A] rounded-br-sm'
                      : isBot
                      ? 'bg-[#353535] text-white rounded-bl-sm'
                      : 'bg-[#353535] text-white rounded-bl-sm'
                  }`}
                >
                  {/* Sender Tag if Bot / Admin */}
                  {!isMe && (
                    <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-white/10 text-[11px] font-semibold text-[#FFD3AC]">
                      <span>{isBot ? '🤖 Support Bot' : '🛡️ Ambé Support Agent'}</span>
                    </div>
                  )}

                  {/* Attachment if present */}
                  {msg.attachmentUrl && (
                    <div className="mb-2">
                      {msg.attachmentType === 'image' ? (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg overflow-hidden border border-black/10"
                        >
                          <img
                            src={msg.attachmentUrl}
                            alt="Attachment"
                            className="max-h-48 w-full object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs underline font-medium text-white/90"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          <span>View Attachment</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Text Content */}
                  {msg.content && (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      isMe ? 'text-[#6B6862]' : 'text-white/60'
                    }`}
                  >
                    {msg.timestamp?.toDate
                      ? msg.timestamp.toDate().toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white border-t border-[#E7E2D9] p-3 sm:p-4 flex items-center gap-2 flex-shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={120}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#FAF8F5] border border-[#E7E2D9] rounded-full px-5 py-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C8996A] placeholder-[#8C827A]"
          />
        </div>
        <button
          type="submit"
          disabled={sending || newMessage.trim().length < 5}
          className="w-11 h-11 rounded-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-shrink-0 cursor-pointer"
          title="Send message"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
