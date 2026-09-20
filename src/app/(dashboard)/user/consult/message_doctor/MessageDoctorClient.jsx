"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ChatWindow from '@/components/chat/ChatWindow';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AmbeBackButton from '@/components/common/AmbeBackButton';

export default function MessageDoctorClient() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    resolveDoctorAndInitChat();
  }, [user, profile]);

  const resolveDoctorAndInitChat = async () => {
    try {
      // Resolve doctor UID from multiple possible schema locations
      let doctorUid = null;
      let initialDoctorName = '';

      if (profile?.doctor) {
        if (typeof profile.doctor === 'string') {
          doctorUid = profile.doctor;
        } else if (typeof profile.doctor === 'object') {
          doctorUid = profile.doctor.uid || profile.doctor.doctor_uid || profile.doctor.id || null;
          if (profile.doctor.first_name || profile.doctor.last_name) {
            initialDoctorName = `Dr. ${profile.doctor.first_name || ''} ${profile.doctor.last_name || ''}`.trim();
          }
        }
      }

      if (!doctorUid) {
        doctorUid = profile?.doctor_uid || profile?.matched_doctor || profile?.doctor_id || null;
      }

      if (!initialDoctorName && profile?.doctor_name) {
        initialDoctorName = profile.doctor_name.startsWith('Dr.') 
          ? profile.doctor_name 
          : `Dr. ${profile.doctor_name}`;
      }

      if (!doctorUid) {
        setDoctorInfo(null);
        setLoading(false);
        return;
      }

      // Fetch doctor's full profile from doctors collection
      let resolvedDoctorName = initialDoctorName || 'Doctor';
      let resolvedDoctorPhoto = null;
      let resolvedTitle = '';

      try {
        const doctorSnap = await getDoc(doc(db, 'doctors', doctorUid));
        if (doctorSnap.exists()) {
          const docData = doctorSnap.data();
          const firstName = docData.first_name || '';
          const lastName = docData.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();

          if (fullName) {
            resolvedDoctorName = `Dr. ${fullName}`;
          } else if (docData.name) {
            resolvedDoctorName = docData.name.startsWith('Dr.') ? docData.name : `Dr. ${docData.name}`;
          }

          resolvedDoctorPhoto = docData.profile_picture || docData.photoURL || null;
          resolvedTitle = docData.professional_title || docData.title || (Array.isArray(docData.doctor_fields) ? docData.doctor_fields[0] : '') || '';
        }
      } catch (err) {
        console.error('Error fetching doctor details:', err);
      }

      setDoctorInfo({
        uid: doctorUid,
        name: resolvedDoctorName,
        photoUrl: resolvedDoctorPhoto,
        title: resolvedTitle,
      });

      // Construct chatId matching mobile app and cloud functions: `${user.uid}_${doctorUid}`
      const newChatId = `${user.uid}_${doctorUid}`;

      const userName = profile?.first_name 
        ? `${profile.first_name} ${profile.last_name || ''}`.trim() 
        : (user.displayName || user.email?.split('@')[0] || 'User');

      // Ensure chat document and doctor chat metadata exist
      try {
        const chatRef = doc(db, 'chats', newChatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
          await setDoc(chatRef, {
            participants: [user.uid, doctorUid],
            participant_names: {
              [user.uid]: userName,
              [doctorUid]: resolvedDoctorName,
            },
            created_at: serverTimestamp(),
            last_message: null,
            last_message_time: null,
          });

          await setDoc(
            doc(db, 'doctors', doctorUid, 'chats', newChatId),
            {
              user_uid: user.uid,
              user_name: userName,
              unread_count: 0,
              last_message: null,
              last_message_time: null,
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.error('Error ensuring chat doc:', err);
      }

      setChatId(newChatId);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSendMessage = profile?.is_first_consultation_completed || false;

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD3AC]"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!doctorInfo) {
    return (
      <ProtectedRoute userType="user">
        <div className="max-w-4xl mx-auto p-8 text-center h-[calc(100vh-120px)] flex items-center justify-center">
          <div className="bg-[#2D2D30]/85 border border-white/10 rounded-2xl p-8 sm:p-10 shadow-xl max-w-md w-full backdrop-blur-md">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-[#FFD3AC]/60 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Doctor Assigned</h2>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              You need to be matched with an integrative doctor before you can send messages.
            </p>
            <button
              onClick={() => router.push('/user/get-matched')}
              className="bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] px-6 py-3 rounded-full text-sm font-semibold transition shadow-md cursor-pointer"
            >
              Get Matched Now
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="h-[calc(100vh-64px)] flex flex-col bg-transparent">
        {/* Modern Doctor Chat Header */}
        <div className="bg-[#1E1E1E]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            <AmbeBackButton onClick={() => router.push('/user/consult')} />

            <div className="relative">
              {doctorInfo.photoUrl ? (
                <img
                  src={doctorInfo.photoUrl}
                  alt={doctorInfo.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#FFD3AC]/60"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/20 border border-[#FFD3AC]/40 flex items-center justify-center text-[#FFD3AC] font-bold text-sm">
                  {doctorInfo.name.replace('Dr. ', '').charAt(0) || 'D'}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1E1E1E]" />
            </div>

            <div>
              <h1 className="text-base font-semibold text-white leading-tight">
                {doctorInfo.name}
              </h1>
              <p className="text-xs text-white/60">
                {doctorInfo.title || 'Assigned Integrative Doctor'}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-[#FFD3AC] bg-white/5 border border-white/10 px-3 py-1 rounded-full font-medium">
              Direct Care Thread
            </span>
          </div>
        </div>

        {/* Chat Window Container */}
        <div className="flex-1 overflow-hidden">
          {chatId && (
            <ChatWindow
              chatId={chatId}
              recipientName={doctorInfo.name}
              recipientId={doctorInfo.uid}
              canSendMessage={canSendMessage}
              isDoctor={false}
              hideHeader={true}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}