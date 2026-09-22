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
import AmbeBackButton from '@/components/common/AmbeBackButton';
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  'General Question',
  'Billing & Payment',
  'Technical Support',
  'Feedback & Suggestions',
];

export default function DoctorSupportPage() {
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
        if (error?.code === 'permission-denied') return;
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

      // Fetch doctor profile info from doctors collection
      let userName = user.displayName || 'Doctor';
      let profilePicture = user.photoURL || null;

      try {
        const docSnap = await getDoc(doc(db, 'doctors', user.uid));
        if (docSnap.exists()) {
          const dData = docSnap.data();
          const fullName = `${dData.first_name || ''} ${dData.last_name || ''}`.trim();
          userName = fullName || user.displayName || 'Doctor';
          profilePicture = dData.profile_picture || user.photoURL || profilePicture;
        } else {
          // Fallback check in users collection if needed
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            userName = uData.first_name || uData.name || user.displayName || 'Doctor';
            profilePicture = uData.profile_picture || uData.photoURL || profilePicture;
          }
        }
      } catch (err) {
        console.warn('Could not fetch doctor info:', err);
      }

      // Create Ticket Document
      const ticketRef = await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        userRole: 'doctor',
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

      // Add Initial Doctor Message
      await addDoc(collection(db, 'tickets', ticketRef.id, 'messages'), {
        content: trimmed,
        senderId: user.uid,
        senderRole: 'doctor',
        timestamp: serverTimestamp(),
      });

      // Automated Bot welcome reply
      setTimeout(async () => {
        try {
          const botMessage =
            '👋 Hello! Thanks for reaching out to support. Our team has received your ticket and will assist you shortly. Please feel free to share any additional details. Please allow 24 hrs within business hours for our team to get back to you.';

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
        <div className="animate-spin h-10 w-10 border-2 border-[#FFD3AC] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 md:pb-12 pt-4 px-4 sm:px-6 max-w-xl mx-auto space-y-6">
      {/* Top Bar with Centered Title matching Flutter AppBar */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute left-0">
          <AmbeBackButton
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/doctor/menu');
              }
            }}
          />
        </div>
        <h1 className="font-serif text-2xl font-normal tracking-wide text-white">
          Support Chat
        </h1>
      </div>

      {openTicket ? (
        <SupportChatView ticket={openTicket} user={user} />
      ) : (
        <div className="pt-2">
          <div className="text-center max-w-md mx-auto mb-8">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white mb-2">
              How can we help you?
            </h2>
            <p className="text-sm text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Create a support ticket and we will respond as soon as possible.
            </p>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-6 max-w-md mx-auto">
            {formError && (
              <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl text-xs text-red-200">
                {formError}
              </div>
            )}

            {/* Topic Dropdown */}
            <div>
              <label className="block font-serif text-lg text-white/90 mb-2">
                Select Topic
              </label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none bg-[#2A2A2E] border border-white/5 rounded-2xl px-4 py-3.5 text-base text-white font-normal focus:outline-none focus:border-[#FFD3AC]/40 pr-10 cursor-pointer shadow-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#2A2A2E] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-[#FFD3AC]">
                  <ChevronDownIcon className="h-5 w-5 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-serif text-lg text-white/90 mb-2">
                Description
              </label>
              <div className="bg-[#2A2A2E] border border-white/5 rounded-2xl p-4 shadow-sm focus-within:border-[#FFD3AC]/40">
                <textarea
                  rows={6}
                  maxLength={120}
                  placeholder="Describe your issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-transparent border-none text-base text-white placeholder-neutral-500 focus:outline-none resize-none leading-relaxed"
                />
                <div className="text-right text-xs text-neutral-400 mt-2 font-mono">
                  {description.length}/120
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FFD3AC] hover:bg-[#ffe2c8] text-black py-4 rounded-full text-base font-bold uppercase tracking-wider shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? 'SUBMITTING TICKET…' : 'SUBMIT TICKET'}
              </button>
            </div>
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

    const unsub = onSnapshot(
      msgsQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setMessages(msgs);
      },
      (err) => {
        if (err?.code === 'permission-denied') return;
        console.error('Error listening to support messages:', err);
      }
    );

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
        senderRole: 'doctor',
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
    <div className="bg-[#2D2D30] border border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[700px]">
      {/* Header matching Flutter app */}
      <div className="bg-[#1E1E1E] border-b border-white/10 px-6 py-4 flex-shrink-0">
        <h2 className="font-serif text-2xl font-normal text-white">
          {ticket.category || 'General Question'}
        </h2>
        <p className="text-xs text-white/50 mt-1">
          Ticket #{ticket.id.substring(0, 6)}
        </p>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#1E1E1E]/40">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-white/50">
            No messages yet
          </div>
        ) : (
          messages.map((msg) => {
            const senderRole = msg.senderRole || 'doctor';
            const isBot = senderRole === 'bot';
            const isMe = senderRole !== 'admin' && !isBot;

            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[75%] px-4 py-3 text-sm shadow-sm ${
                    isMe
                      ? 'bg-[#FFD3AC] text-[#1E1E1E] rounded-2xl rounded-br-none font-medium'
                      : 'bg-[#2D2D30] text-white rounded-2xl rounded-bl-none'
                  }`}
                >
                  {/* Attachment if present */}
                  {msg.attachmentUrl && (
                    <div className="mb-2">
                      {msg.attachmentType === 'image' ? (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-lg overflow-hidden border border-white/10"
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
                          className="inline-flex items-center gap-2 text-xs underline font-medium text-[#FFD3AC]"
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
        className="bg-[#1E1E1E] border-t border-white/10 p-3 sm:p-4 flex items-center gap-3 flex-shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={120}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-[#2D2D30] border-none rounded-full px-5 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#FFD3AC]"
          />
        </div>
        <button
          type="submit"
          disabled={sending || newMessage.trim().length < 5}
          className="w-10 h-10 rounded-full bg-[#FFD3AC] hover:bg-[#ffe0c4] text-white flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-shrink-0 cursor-pointer"
          title="Send message"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
