"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
} from '@heroicons/react/24/solid';
import {
  // There's no dedicated "microphone off" icon in this set — MicrophoneIcon
  // is reused below with a SlashIcon overlaid on top to indicate muted,
  // rather than aliasing it to a misleadingly-named "off" icon that looked
  // identical to the "on" state.
  MicrophoneIcon as MicrophoneOutlineIcon,
  SlashIcon,
  VideoCameraSlashIcon,
} from '@heroicons/react/24/outline';

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

export default function VideoCall({
  appointmentId,
  userId,
  otherPartyUid,
  isDoctor,
  onCallEnd
}) {
  // The Agora client is created fresh inside the effect below (not here)
  // so React's dev-only Strict Mode mount->cleanup->remount cycle gets an
  // independent client per effect run, rather than reusing one shared
  // instance across both — reusing one instance meant the second run's
  // join() collided with the first (throwaway) run's still-connecting
  // client, throwing "Client already in connecting/connected state".
  // clientRef always points at whichever instance the active effect run
  // created, for use by button handlers (toggleMute/endCall) outside it.
  const clientRef = useRef(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Same channel/uid must be used both when requesting the token and when
  // actually joining, or Agora rejects the join (the token is signed for a
  // specific channel + uid pair). "consult_" prefix matches what the
  // backend requires and what the mobile app already uses for this same
  // appointment's channel.
  const channelName = `consult_${appointmentId}`;
  const numericUid = stableAgoraUid(userId);

  useEffect(() => {
    let cancelled = false;
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    const handleUserJoined = (user) => {
      console.log('User joined:', user.uid);
    };

    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);

      if (mediaType === 'video' && remoteVideoRef.current) {
        user.videoTrack?.play(remoteVideoRef.current);
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
      if (mediaType === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = '';
      }
    };

    const handleUserLeft = (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    };

    const initializeAgora = async () => {
      try {
        // Deliberately calling the plain-HTTP generateAgoraTokenPublic
        // endpoint rather than the httpsCallable generateAgoraToken
        // function (same one the mobile app already uses successfully) —
        // the callable version's Cloud Run service is missing its
        // public-invoker IAM binding despite declaring `invoker: "public"`
        // in its own source, so every caller gets rejected with a
        // platform-level 403 before the function code ever runs. Fixing
        // that IAM policy directly isn't possible with the access
        // available when this was written; this endpoint is a
        // proven-working equivalent with an identical request/response
        // shape.
        const response = await fetch(
          'https://us-central1-ambe-wellness.cloudfunctions.net/generateAgoraTokenPublic',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelName, uid: numericUid }),
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

        // Join channel
        await client.join(data.appId, channelName, data.token, numericUid);
        if (cancelled) {
          await client.leave().catch(() => {});
          return;
        }

        // Signal this join on the same shared `consultations/{appointmentId}`
        // document the mobile app writes to (see video_chat_page.dart) — a
        // Cloud Functions trigger already deployed and watching this
        // collection pushes a "your doctor/patient joined" notification to
        // whichever platform the other participant is on. Without this
        // write, a doctor or patient joining from the website never
        // notifies the other side, even though the reverse (app -> web)
        // works today because only the app was writing here before.
        try {
          await setDoc(
            doc(db, 'consultations', appointmentId),
            isDoctor
              ? {
                  doctor_joined: true,
                  doctor_joined_at: serverTimestamp(),
                  doctor_id: userId,
                  ...(otherPartyUid ? { user_id: otherPartyUid } : {}),
                }
              : {
                  user_joined: true,
                  user_joined_at: serverTimestamp(),
                  user_id: userId,
                  ...(otherPartyUid ? { doctor_id: otherPartyUid } : {}),
                },
            { merge: true }
          );
        } catch (signalError) {
          // Non-fatal — the call itself should proceed even if the
          // notification signal fails to write.
          console.error('Error writing join signal:', signalError);
        }

        // Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          audioTrack.close();
          videoTrack.close();
          await client.leave().catch(() => {});
          return;
        }
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Publish tracks
        await client.publish([audioTrack, videoTrack]);
        setIsJoined(true);

      } catch (error) {
        console.error('Error initializing Agora:', error);
        if (!cancelled) {
          setError('Failed to join video call. Please check your camera and microphone permissions.');
        }
      }
    };

    initializeAgora();

    // Tears down THIS effect run's own client/tracks — doesn't touch
    // component state, so a throwaway Strict Mode cleanup can't clobber a
    // later real run's state updates. Deliberately does NOT call
    // onCallEnd here; that belongs only to the hang-up button's own
    // handler (endCall below), so an incidental unmount can never
    // silently navigate the user away mid-call.
    return () => {
      cancelled = true;
      client.leave().catch(() => {});
    };
  }, []);

  const toggleMute = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  // Releases local Agora resources for the hang-up button's own use (see
  // endCall below). The effect above handles its own teardown separately
  // on unmount, so this only ever runs from a deliberate user action.
  const releaseLocalResources = async () => {
    try {
      // Stop and close local tracks
      localAudioTrack?.stop();
      localAudioTrack?.close();
      localVideoTrack?.stop();
      localVideoTrack?.close();

      // Leave the channel
      await clientRef.current?.leave();

      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setIsJoined(false);
    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  // The hang-up button's actual handler — releases resources, then
  // navigates away via onCallEnd. Unlike releaseLocalResources, this must
  // only run from a deliberate user action, never from an incidental
  // unmount.
  const endCall = async () => {
    await releaseLocalResources();
    onCallEnd?.();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Error Message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video - Full Screen */}
        <div 
          ref={remoteVideoRef}
          className="w-full h-full bg-gray-900 flex items-center justify-center"
        >
          {remoteUsers.length === 0 && (
            <div className="text-white text-center">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <VideoCameraSlashIcon className="w-12 h-12" />
              </div>
              <p className="text-lg">Waiting for {isDoctor ? 'user' : 'doctor'} to join...</p>
            </div>
          )}
        </div>

        {/* Local Video - Picture in Picture */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          {/* relative wrapper: Agora plays the local video track directly
              into this div and leaves the last frame frozen (not removed)
              when the track is disabled, so the "camera is off" placeholder
              below is absolutely positioned to actually cover it, rather
              than rendering as an inline sibling that never became visible. */}
          <div
            ref={localVideoRef}
            className="relative w-full h-full"
          >
            {isVideoOff && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gray-700">
                <VideoCameraSlashIcon className="w-8 h-8 text-white" />
                <p className="text-white text-xs">Your camera is off</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              isMuted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700 hover:bg-gray-600'
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
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-gray-700 hover:bg-gray-600'
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
            onClick={endCall}
            className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-all"
          >
            <PhoneXMarkIcon className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Call Info */}
      <div className="absolute top-4 left-4 text-white">
        <p className="text-lg font-medium">Video Consultation</p>
        <p className="text-sm opacity-75">Appointment ID: {appointmentId}</p>
      </div>
    </div>
  );
}