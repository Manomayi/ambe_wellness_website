"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { doc, setDoc, onSnapshot, serverTimestamp, deleteField, collection, query, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/solid';
import {
  MicrophoneIcon as MicrophoneOutlineIcon,
  SlashIcon,
  VideoCameraSlashIcon,
  ChatBubbleLeftRightIcon as ChatOutlineIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import PaymentProcessingOverlay from '@/components/common/PaymentProcessingOverlay';
import ChatWindow from '@/components/chat/ChatWindow';
import PatientHealthProfilePanel from '@/components/doctor/PatientHealthProfilePanel';

// Agora requires a numeric UID, but Firebase Auth UIDs are strings — this
// deterministically derives a stable positive integer from a UID string
// (FNV-1a-style hash) so the same user always gets the same Agora UID
// within a call, without needing to store a separate numeric ID anywhere.
function stableAgoraUid(input) {
  const fnvPrime = 16777619;
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, fnvPrime) & 0x7fffffff;
  }
  return hash === 0 ? 1 : hash;
}

function MedicalServicesIcon({ className = "w-6 h-6", filled = false }) {
  if (filled) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 7h-3V4.5C16 3.67 15.33 3 14.5 3h-5C8.67 3 8 3.67 8 4.5V7H5C3.9 7 3 7.9 3 9v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9.5-2.5h5V7h-5V4.5zM15 14h-2v2c0 .55-.45 1-1 1s-1-.45-1-1v-2H9c-.55 0-1-.45-1-1s.45-1 1-1h2v-2c0-.55.45-1 1-1s1 .45 1 1v2h2c.55 0 1 .45 1 1s-.45 1-1 1z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V7" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

export default function VideoCall({
  appointmentId,
  userId,
  otherPartyUid,
  isDoctor,
  onCallEnd,
  onBack,
}) {
  const router = useRouter();
  const clientRef = useRef(null);
  const onCallEndRef = useRef(onCallEnd);
  const hadRemoteJoinedRef = useRef(false);
  const callEndedRef = useRef(false);

  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const initializeAgoraRef = useRef(null);

  useEffect(() => {
    onCallEndRef.current = onCallEnd;
  }, [onCallEnd]);

  const [mounted, setMounted] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(false);
  const [error, setError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [permissionErrorDetail, setPermissionErrorDetail] = useState('');
  const [isRetryingPermissions, setIsRetryingPermissions] = useState(false);
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activePanel, setActivePanel] = useState(null); // null | 'chat' | 'profile'
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [counterpartName, setCounterpartName] = useState(isDoctor ? 'Client' : 'Practitioner');

  const patientUid = isDoctor ? otherPartyUid : userId;
  const doctorUid = isDoctor ? userId : otherPartyUid;
  const chatId = patientUid && doctorUid ? `${patientUid}_${doctorUid}` : null;

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (!appointmentId) return;
    const unsub = onSnapshot(doc(db, 'consultations', appointmentId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() || {};
        if (isDoctor && data.user_name) {
          setCounterpartName(data.user_name);
        } else if (!isDoctor && data.doctor_name) {
          setCounterpartName(data.doctor_name);
        }
      }
    });
    return () => unsub();
  }, [appointmentId, isDoctor]);

  const lastSeenChatTimeRef = useRef(0);

  useEffect(() => {
    if (activePanel === 'chat') {
      lastSeenChatTimeRef.current = Date.now();
      setUnreadChatCount(0);
    }
  }, [activePanel]);

  // Sync last read time from Firestore chats metadata doc
  useEffect(() => {
    if (!chatId || !userId) return;
    const unsub = onSnapshot(
      doc(db, 'chats', chatId),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const lastReadTime = isDoctor
          ? data.last_read_by_doctor_time?.toMillis?.()
          : data.last_read_by_user_time?.toMillis?.();
        if (lastReadTime && lastReadTime > (lastSeenChatTimeRef.current || 0)) {
          lastSeenChatTimeRef.current = lastReadTime;
        }
        if (activePanel === 'chat') {
          setUnreadChatCount(0);
        }
      },
      (err) => {
        if (err?.code !== 'permission-denied') {
          console.warn('[VideoCall] chat meta listener:', err);
        }
      }
    );
    return () => unsub();
  }, [chatId, userId, isDoctor, activePanel]);

  useEffect(() => {
    if (!chatId || !userId) return;
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('read', '==', false)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (activePanel === 'chat') {
          lastSeenChatTimeRef.current = Date.now();
          setUnreadChatCount(0);
          return;
        }
        const unreadFromOther = snapshot.docs.filter((d) => {
          const data = d.data();
          if (data.sender_uid === userId) return false;
          if (data.read === true) return false;
          if (lastSeenChatTimeRef.current && data.timestamp?.toMillis) {
            if (data.timestamp.toMillis() <= lastSeenChatTimeRef.current) {
              return false;
            }
          }
          return true;
        }).length;
        setUnreadChatCount(unreadFromOther);
      },
      (err) => {
        if (err?.code !== 'permission-denied') {
          console.warn('[VideoCall] unread chat listener:', err);
        }
      }
    );
    return () => unsub();
  }, [chatId, userId, activePanel]);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const channelName = `consult_${appointmentId}`;
  const numericUid = stableAgoraUid(userId);

  // Helper to completely stop and close a track, including the underlying browser hardware MediaStreamTrack
  const stopAndCloseTrack = (track) => {
    if (!track) return;
    try {
      track.stop();
    } catch (e) {
      console.warn('Track stop error:', e);
    }
    try {
      track.close();
    } catch (e) {
      console.warn('Track close error:', e);
    }
    try {
      if (typeof track.getMediaStreamTrack === 'function') {
        const rawMediaStreamTrack = track.getMediaStreamTrack();
        if (rawMediaStreamTrack && typeof rawMediaStreamTrack.stop === 'function') {
          rawMediaStreamTrack.stop();
        }
      }
    } catch (e) {
      console.warn('Raw MediaStreamTrack stop error:', e);
    }
  };

  // Releases local Agora resources and turns off camera/mic hardware
  const releaseLocalResources = async () => {
    try {
      const audio = localAudioTrackRef.current;
      const video = localVideoTrackRef.current;

      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;

      stopAndCloseTrack(audio);
      stopAndCloseTrack(video);

      if (clientRef.current) {
        await clientRef.current.leave().catch(() => {});
      }

      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setIsJoined(false);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  // Called when remote user ends the call or leaves the channel
  const handleRemoteCallEnd = async (remoteData = {}) => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    setIsLeaving(true);
    console.log('[VideoCall] Terminating session and navigating away');
    await releaseLocalResources();
    const endedByDoctor = remoteData?.call_ended_by ? remoteData.call_ended_by === 'doctor' : !isDoctor;
    onCallEndRef.current?.({ endedByDoctor });
  };

  // Called when local user clicks the hangup button
  const endCall = async () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    setIsLeaving(true);

    try {
      await setDoc(
        doc(db, 'consultations', appointmentId),
        {
          call_status: 'ended',
          call_ended_by: isDoctor ? 'doctor' : 'user',
          call_ended_at: serverTimestamp(),
          ...(isDoctor ? { doctor_id: userId } : { user_id: userId }),
          ...(otherPartyUid
            ? (isDoctor ? { user_id: otherPartyUid } : { doctor_id: otherPartyUid })
            : {}),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('[VideoCall] Error writing call_status=ended:', e);
    }

    await releaseLocalResources();
    onCallEndRef.current?.({ endedByDoctor: isDoctor });
  };

  const handleBack = async () => {
    await releaseLocalResources();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  useEffect(() => {
    let cancelled = false;
    const sessionStartTime = Date.now();
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    const handleUserJoined = (user) => {
      console.log('[VideoCall] User joined:', user.uid);
      hadRemoteJoinedRef.current = true;
    };

    const handleUserPublished = async (user, mediaType) => {
      hadRemoteJoinedRef.current = true;
      await client.subscribe(user, mediaType);

      if (mediaType === 'video') {
        setIsRemoteVideoOff(false);
        if (remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
      }

      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }

      setRemoteUsers(prev => {
        const existing = prev.find(u => u.uid === user.uid);
        if (existing) {
          return prev;
        }
        return [...prev, user];
      });
    };

    const handleUserUnpublished = (user, mediaType) => {
      if (mediaType === 'video') {
        setIsRemoteVideoOff(true);
        try {
          user.videoTrack?.stop();
        } catch (_) {}
        if (remoteVideoRef.current) {
          remoteVideoRef.current.innerHTML = '';
        }
      }
    };

    let hasObservedActiveCall = false;
    const handleUserLeft = (user) => {
      console.log('[VideoCall] Remote user left channel:', user.uid);
      setIsRemoteVideoOff(false);
      try {
        user.videoTrack?.stop();
      } catch (_) {}
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      // Do NOT terminate or complete the consultation here.
      // A participant may have stepped back or disconnected temporarily,
      // and is permitted to re-join. Actual call termination is controlled
      // by the Firestore call_status == 'ended' listener when either party
      // explicitly clicks the End Call button.
    };

    // Listen to shared consultation doc for remote call end signal
    let unsubConsultation = null;
    try {
      unsubConsultation = onSnapshot(
        doc(db, 'consultations', appointmentId),
        (snap) => {
          if (cancelled || callEndedRef.current) return;
          if (snap.exists()) {
            const data = snap.data();
            if (data.call_status === 'active') {
              hasObservedActiveCall = true;
            }
            if (data.call_status === 'ended') {
              const endedAt = data.call_ended_at?.toMillis ? data.call_ended_at.toMillis() : Date.now();
              const isOtherParty = data.call_ended_by ? data.call_ended_by !== (isDoctor ? 'doctor' : 'user') : true;
              if (hasObservedActiveCall || isOtherParty || endedAt >= sessionStartTime - 30000) {
                console.log('[VideoCall] Detected call_status=ended from Firestore:', data);
                handleRemoteCallEnd(data);
              }
            }
          }
        },
        (err) => {
          if (err?.code === 'permission-denied') return;
          console.error('[VideoCall] Consultation doc listener error:', err);
        }
      );
    } catch (listenerErr) {
      console.warn('[VideoCall] Could not attach consultation listener:', listenerErr);
    }

    const initializeAgora = async (isRetry = false) => {
      if (cancelled) return;
      try {
        setError('');
        if (isRetry) {
          setIsRetryingPermissions(true);
        }

        // 1. Unified getUserMedia call - triggers ONE native prompt in Safari for BOTH camera and mic
        // This solves the WebKit bug where concurrent getUserMedia requests cancel or drop the video prompt.
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          try {
            const probeStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              },
            });
            probeStream.getTracks().forEach((track) => {
              try {
                track.stop();
              } catch (_) {}
            });
          } catch (probeErr) {
            console.warn('[VideoCall] Combined getUserMedia probe note:', probeErr);
            if (probeErr.name === 'NotAllowedError' || probeErr.name === 'PermissionDeniedError') {
              setPermissionStatus('denied');
              setPermissionErrorDetail(
                'Camera and/or Microphone permissions were denied. Please allow camera and microphone access to join the video call.'
              );
              return;
            }
          }
        }

        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const response = await fetch(
          'https://us-central1-ambe-wellness.cloudfunctions.net/generateAgoraTokenPublic',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
            },
            body: JSON.stringify({
              channelName,
              uid: numericUid,
              idToken: idToken,
            }),
          }
        );
        const data = await response.json();

        if (!response.ok || !data.token) {
          throw new Error(data.error || 'Failed to get Agora token');
        }
        if (cancelled) return;

        // Set up event handlers
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-left', handleUserLeft);
        client.on('user-joined', handleUserJoined);

        // Join channel if not already connected
        if (!client.connectionState || client.connectionState === 'DISCONNECTED') {
          await client.join(data.appId, channelName, data.token, numericUid);
        }
        if (cancelled) {
          await client.leave().catch(() => {});
          return;
        }

        // Signal join on shared consultations doc
        try {
          await setDoc(
            doc(db, 'consultations', appointmentId),
            {
              ...(isDoctor
                ? {
                    doctor_joined: true,
                    doctor_joined_at: serverTimestamp(),
                    doctor_id: userId,
                  }
                : {
                    user_joined: true,
                    user_joined_at: serverTimestamp(),
                    user_id: userId,
                  }),
              ...(otherPartyUid
                ? (isDoctor ? { user_id: otherPartyUid } : { doctor_id: otherPartyUid })
                : {}),
              call_status: 'active',
            },
            { merge: true }
          );

          const patientUid = isDoctor ? otherPartyUid : userId;
          const docUid = isDoctor ? userId : otherPartyUid;
          const joinPayload = isDoctor
            ? { doctor_joined: true, doctor_joined_at: serverTimestamp() }
            : { user_joined: true, user_joined_at: serverTimestamp() };

          if (patientUid) {
            setDoc(doc(db, 'users', patientUid, 'appointments_upcoming', appointmentId), joinPayload, { merge: true }).catch(() => {});
          }
          if (docUid) {
            setDoc(doc(db, 'doctors', docUid, 'appointments_upcoming', appointmentId), joinPayload, { merge: true }).catch(() => {});
          }
        } catch (signalError) {
          console.error('[VideoCall] Error writing join signal:', signalError);
        }

        // 2. Create local tracks sequentially so Safari/WebKit never crashes on parallel calls
        let audioTrack = null;
        let videoTrack = null;

        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        } catch (audioErr) {
          console.warn('[VideoCall] Audio track creation error:', audioErr);
        }

        try {
          videoTrack = await AgoraRTC.createCameraVideoTrack({
            encoderConfig: '720p_2',
            optimizationMode: 'detail',
          });
        } catch (videoErr) {
          console.warn('[VideoCall] Video track creation error:', videoErr);
        }

        if (cancelled) {
          stopAndCloseTrack(audioTrack);
          stopAndCloseTrack(videoTrack);
          await client.leave().catch(() => {});
          return;
        }

        if (!audioTrack && !videoTrack) {
          setPermissionStatus('denied');
          setPermissionErrorDetail(
            'Neither camera nor microphone could be accessed. Please ensure permissions are allowed in Safari settings and retry.'
          );
          return;
        }

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        setIsMuted(!audioTrack);
        setIsVideoOff(!videoTrack);

        // Play local video
        if (videoTrack && localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          videoTrack.play(localVideoRef.current);
        }

        // Publish available tracks safely
        const tracksToPublish = [audioTrack, videoTrack].filter(Boolean);
        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
        }

        setIsJoined(true);
        setPermissionStatus('granted');
        setPermissionErrorDetail('');
        setError('');
      } catch (error) {
        console.error('[VideoCall] Initialization error:', error);
        if (!cancelled) {
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setPermissionStatus('denied');
            setPermissionErrorDetail('Permissions were denied. Please allow camera and microphone access.');
          } else {
            setError('Failed to join video call. Please check your camera and microphone permissions.');
          }
        }
      } finally {
        setIsRetryingPermissions(false);
      }
    };

    initializeAgoraRef.current = initializeAgora;
    initializeAgora();

    return () => {
      cancelled = true;
      if (typeof unsubConsultation === 'function') {
        try {
          unsubConsultation();
        } catch (_) {}
      }
      // Ensure camera/mic hardware is always closed on unmount
      if (localAudioTrackRef.current) {
        stopAndCloseTrack(localAudioTrackRef.current);
        localAudioTrackRef.current = null;
      }
      if (localVideoTrackRef.current) {
        stopAndCloseTrack(localVideoTrackRef.current);
        localVideoTrackRef.current = null;
      }
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {});
      }
    };
  }, []);

  const handleRetryPermissions = async () => {
    setIsRetryingPermissions(true);
    setPermissionErrorDetail('');
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (_) {}
        });
      }
      setPermissionStatus('prompt');
      if (initializeAgoraRef.current) {
        await initializeAgoraRef.current(true);
      }
    } catch (err) {
      console.warn('[VideoCall] Retry permission prompt failed:', err);
      setPermissionStatus('denied');
      setPermissionErrorDetail(
        'Permissions are still blocked. In Safari, please tap the website settings icon (aA or ⚙️) in the address bar, set Camera and Microphone to "Allow", and tap Allow Permissions again.'
      );
    } finally {
      setIsRetryingPermissions(false);
    }
  };

  const toggleMute = async () => {
    const track = localAudioTrackRef.current || localAudioTrack;
    if (track) {
      const nextMuted = !isMuted;
      await track.setEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } else if (clientRef.current && isJoined) {
      try {
        const newAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = newAudioTrack;
        setLocalAudioTrack(newAudioTrack);
        setIsMuted(false);
        await clientRef.current.publish([newAudioTrack]);
      } catch (err) {
        console.error('[VideoCall] Failed to enable audio track:', err);
        setError('Microphone permission denied or microphone unavailable.');
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  const toggleVideo = async () => {
    const track = localVideoTrackRef.current || localVideoTrack;
    if (track) {
      const nextOff = !isVideoOff;
      await track.setEnabled(!nextOff);
      setIsVideoOff(nextOff);
    } else if (clientRef.current && isJoined) {
      try {
        const newVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '720p_2',
          optimizationMode: 'detail',
        });
        localVideoTrackRef.current = newVideoTrack;
        setLocalVideoTrack(newVideoTrack);
        setIsVideoOff(false);
        if (localVideoRef.current) {
          localVideoRef.current.innerHTML = '';
          newVideoTrack.play(localVideoRef.current);
        }
        await clientRef.current.publish([newVideoTrack]);
      } catch (err) {
        console.error('[VideoCall] Failed to enable camera track:', err);
        setError('Camera permission denied or camera unavailable.');
        setTimeout(() => setError(''), 4000);
      }
    }
  };

  if (isLeaving) {
    return (
      <PaymentProcessingOverlay
        icon="call"
        title="Ending Consultation"
        subtitle="Please wait..."
      />
    );
  }

  const callContent = (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col overflow-hidden select-none">
      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-30 shadow-lg">
          {error}
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video - Full Screen */}
        <div className="relative w-full h-full bg-gray-900 flex items-center justify-center overflow-hidden">
          {/* Dedicated container purely for Agora remote video track playback. React never renders children here. */}
          <div 
            ref={remoteVideoRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Sibling React-managed overlay when remote user has not joined or left */}
          {remoteUsers.length === 0 && (
            <div className="relative z-10 text-white text-center pointer-events-none">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoCameraSlashIcon className="w-12 h-12" />
              </div>
              <p className="text-lg">
                {isDoctor
                  ? 'Please wait up to 5 min for your client to join'
                  : 'Please wait up to 5 min for your practitioner to join'}
              </p>
            </div>
          )}

          {/* Sibling React-managed overlay when remote user's camera is off */}
          {remoteUsers.length > 0 && isRemoteVideoOff && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900 text-white text-center pointer-events-none">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoCameraSlashIcon className="w-12 h-12" />
              </div>
              <p className="text-lg">
                {isDoctor ? "Client's camera is off" : "Practitioner's camera is off"}
              </p>
            </div>
          )}
        </div>

        {/* Local Video - Picture in Picture */}
        <div className={`absolute top-4 w-40 sm:w-48 h-32 sm:h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-white/10 z-20 transition-all duration-300 ${
          activePanel ? 'right-4 sm:right-[440px] md:right-[480px]' : 'right-4'
        }`}>
          {/* Dedicated container purely for Agora local video track playback. React never renders children here. */}
          <div
            ref={localVideoRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Sibling React-managed overlay when local camera is off */}
          {isVideoOff && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-700 pointer-events-none">
              <VideoCameraSlashIcon className="w-8 h-8 text-white" />
              <p className="text-white text-xs">Your camera is off</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 px-4 z-30 pointer-events-auto"
        style={{
          paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 2rem))'
        }}
      >
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {/* Mute/Unmute */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95 ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400/50' 
                : 'bg-gray-700/90 hover:bg-gray-600 ring-1 ring-white/15'
            }`}
          >
            {isMuted ? (
              <span className="relative inline-block w-6 h-6">
                <MicrophoneOutlineIcon className="w-6 h-6 text-white" />
                <SlashIcon className="w-6 h-6 text-white absolute inset-0" />
              </span>
            ) : (
              <MicrophoneIcon className="w-6 h-6 text-white" />
            )}
          </button>

          {/* Video On/Off */}
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95 ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700 ring-2 ring-red-400/50'
                : 'bg-gray-700/90 hover:bg-gray-600 ring-1 ring-white/15'
            }`}
          >
            {isVideoOff ? (
              <VideoCameraSlashIcon className="w-6 h-6 text-white" />
            ) : (
              <VideoCameraIcon className="w-6 h-6 text-white" />
            )}
          </button>

          {/* End Call */}
          <button
            type="button"
            onClick={() => setShowEndCallModal(true)}
            aria-label="End Video Call"
            className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95 ring-2 ring-red-400/50"
          >
            <PhoneXMarkIcon className="w-6 h-6 text-white" />
          </button>

          {/* In-Call Chat (Visible to both doctor and patient) */}
          <button
            type="button"
            onClick={() => {
              if (activePanel !== 'chat') {
                lastSeenChatTimeRef.current = Date.now();
                setUnreadChatCount(0);
                setActivePanel('chat');
              } else {
                setActivePanel(null);
              }
            }}
            aria-label="Toggle In-Call Chat"
            title="In-Call Chat"
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95 ${
              activePanel === 'chat'
                ? 'bg-[#FFD3AC] text-[#1E1E1E] ring-2 ring-[#FFD3AC]/60'
                : 'bg-gray-700/90 hover:bg-gray-600 text-white ring-1 ring-white/15'
            }`}
          >
            {activePanel === 'chat' ? (
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
            ) : (
              <ChatOutlineIcon className="w-6 h-6" />
            )}
            {unreadChatCount > 0 && activePanel !== 'chat' && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Client's Health Profile (Doctor Only) */}
          {isDoctor && (
            <button
              type="button"
              onClick={() => setActivePanel(activePanel === 'profile' ? null : 'profile')}
              aria-label="Toggle Client Health Profile"
              title="Client's Health Profile"
              className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer active:scale-95 ${
                activePanel === 'profile'
                  ? 'bg-[#FFD3AC] text-[#1E1E1E] ring-2 ring-[#FFD3AC]/60'
                  : 'bg-gray-700/90 hover:bg-gray-600 text-[#FFD3AC] ring-1 ring-white/15'
              }`}
            >
              <MedicalServicesIcon 
                className="w-6 h-6" 
                filled={activePanel === 'profile'} 
              />
            </button>
          )}
        </div>
      </div>

      {/* Call Info & Back Button */}
      <div className="absolute top-4 left-4 flex items-center gap-3 z-30 pointer-events-auto">
        <AmbeBackButton 
          onClick={() => setShowBackModal(true)} 
          className="!bg-black/60 hover:!bg-black/80 !border-white/20 !text-[#FFD3AC] shadow-lg shrink-0" 
        />
        <div className="text-white drop-shadow-md">
          <p className="text-sm sm:text-base font-semibold leading-tight">Video Consultation</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] sm:text-xs text-white/70">Appointment ID: {appointmentId}</p>
            {isDoctor && (
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === 'profile' ? null : 'profile')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#FFD3AC] text-[11px] font-medium border border-[#FFD3AC]/30 transition cursor-pointer"
              >
                <MedicalServicesIcon className="w-3.5 h-3.5" />
                Health Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Side Panel Drawer (In-Call Chat or Client Profile) */}
      {activePanel && (
        <div 
          className="fixed top-0 bottom-0 right-0 w-full sm:w-[420px] md:w-[460px] z-40 bg-[#181818] shadow-2xl border-l border-white/10 flex flex-col"
          style={{
            maxHeight: '100vh',
          }}
        >
          {activePanel === 'chat' && (
            <div className="flex flex-col h-full bg-[#181818]">
              {/* Chat Drawer Header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#1E1E1E] shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#FFD3AC]/20 flex items-center justify-center text-[#FFD3AC] shrink-0">
                    <ChatOutlineIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">
                      Consultation Chat
                    </h3>
                    <p className="text-[11px] text-[#FFD3AC] truncate">
                      with {counterpartName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
                  aria-label="Close Chat"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Embedded ChatWindow */}
              <div className="flex-1 min-h-0 relative overflow-hidden">
                {chatId ? (
                  <ChatWindow
                    chatId={chatId}
                    recipientName={counterpartName}
                    recipientId={otherPartyUid}
                    canSendMessage={true}
                    isDoctor={isDoctor}
                    hideHeader={true}
                    onMessagesSeen={(ts) => {
                      lastSeenChatTimeRef.current = ts || Date.now();
                      setUnreadChatCount(0);
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/60 text-sm">
                    Connecting to chat...
                  </div>
                )}
              </div>
            </div>
          )}

          {activePanel === 'profile' && isDoctor && (
            <PatientHealthProfilePanel
              userUid={patientUid}
              userName={counterpartName}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      )}

      {/* End Call Confirmation Modal */}
      {showEndCallModal && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/15 rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center mx-auto text-red-500">
              <PhoneXMarkIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Complete Consultation?</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Are you sure to complete the consultation? Once you hang up, you will not be able to join again and the consultation will be completed.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEndCallModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndCallModal(false);
                  endCall();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition shadow-md cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button Confirmation Modal */}
      {showBackModal && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/15 rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/40 flex items-center justify-center mx-auto text-[#FFD3AC]">
              <ArrowLeftIcon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white">Are you sure to go back?</h3>
            <p className="text-sm text-white/70 leading-relaxed">
              This will not end the call and consultation will not be completed. You can join the call again.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBackModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBackModal(false);
                  handleBack();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] font-bold text-sm transition shadow-md cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Denied Modal */}
      {permissionStatus === 'denied' && (
        <div className="fixed inset-0 z-[10001] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] border border-white/15 rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FFD3AC]/15 border border-[#FFD3AC]/40 flex items-center justify-center mx-auto text-[#FFD3AC]">
              <VideoCameraSlashIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-serif">
              Camera & Microphone Access Required
            </h3>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              {permissionErrorDetail ||
                'To connect with your consultation, please allow access to both your camera and microphone.'}
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-left space-y-1.5">
              <p className="text-[11px] font-bold text-[#FFD3AC] tracking-wider uppercase">
                If Using Safari:
              </p>
              <ul className="text-[11px] text-white/70 space-y-1 list-disc list-inside">
                <li>Tap <strong>Allow</strong> when the browser asks for Camera & Microphone.</li>
                <li>If blocked, tap the website settings icon (<strong>aA</strong> or <strong>⚙️</strong>) in your Safari URL bar.</li>
                <li>Set both <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong>.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 font-semibold text-sm transition cursor-pointer"
              >
                Leave Call
              </button>
              <button
                type="button"
                onClick={handleRetryPermissions}
                disabled={isRetryingPermissions}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#FFD3AC] hover:bg-[#ffe0c4] text-[#1E1E1E] font-bold text-sm transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {isRetryingPermissions ? 'REQUESTING...' : 'ALLOW PERMISSIONS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!mounted) return null;
  return typeof document !== 'undefined' ? createPortal(callContent, document.body) : null;
}