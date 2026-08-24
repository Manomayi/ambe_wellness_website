"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { doc, setDoc, onSnapshot, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
} from '@heroicons/react/24/solid';
import {
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
  const clientRef = useRef(null);
  const onCallEndRef = useRef(onCallEnd);
  const hadRemoteJoinedRef = useRef(false);
  const callEndedRef = useRef(false);

  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  useEffect(() => {
    onCallEndRef.current = onCallEnd;
  }, [onCallEnd]);

  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState('');

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
  const handleRemoteCallEnd = async () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;
    console.log('[VideoCall] Terminating session and navigating away');
    await releaseLocalResources();
    onCallEndRef.current?.();
  };

  // Called when local user clicks the hangup button
  const endCall = async () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;

    try {
      await setDoc(
        doc(db, 'consultations', appointmentId),
        {
          call_status: 'ended',
          call_ended_by: isDoctor ? 'doctor' : 'user',
          call_ended_at: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('[VideoCall] Error writing call_status=ended:', e);
    }

    await releaseLocalResources();
    onCallEndRef.current?.();
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
      console.log('[VideoCall] Remote user left channel:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      // If remote user had previously joined and now left, end the call
      if (hadRemoteJoinedRef.current && !callEndedRef.current) {
        handleRemoteCallEnd();
      }
    };

    // Listen to shared consultation doc for remote call end signal
    const unsubConsultation = onSnapshot(
      doc(db, 'consultations', appointmentId),
      (snap) => {
        if (cancelled || callEndedRef.current) return;
        if (snap.exists()) {
          const data = snap.data();
          if (data.call_status === 'ended') {
            const endedAt = data.call_ended_at?.toMillis ? data.call_ended_at.toMillis() : Date.now();
            if (endedAt >= sessionStartTime - 10000) {
              console.log('[VideoCall] Detected call_status=ended from Firestore:', data);
              handleRemoteCallEnd();
            }
          }
        }
      },
      (err) => {
        console.error('[VideoCall] Consultation doc listener error:', err);
      }
    );

    const initializeAgora = async () => {
      try {
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
              // Clear previous call_status if joining anew
              call_status: deleteField(),
              call_ended_by: deleteField(),
              call_ended_at: deleteField(),
            },
            { merge: true }
          );
        } catch (signalError) {
          console.error('[VideoCall] Error writing join signal:', signalError);
        }

        // Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        if (cancelled) {
          stopAndCloseTrack(audioTrack);
          stopAndCloseTrack(videoTrack);
          await client.leave().catch(() => {});
          return;
        }

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;
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

    return () => {
      cancelled = true;
      unsubConsultation();
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

  const toggleMute = async () => {
    const track = localAudioTrackRef.current || localAudioTrack;
    if (track) {
      await track.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    const track = localVideoTrackRef.current || localVideoTrack;
    if (track) {
      await track.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
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