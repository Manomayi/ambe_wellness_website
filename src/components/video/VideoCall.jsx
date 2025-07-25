"use client";

import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
} from '@heroicons/react/24/solid';
import {
  MicrophoneIcon as MicrophoneOffIcon,
  VideoCameraIcon as VideoCameraOffIcon,
} from '@heroicons/react/24/outline';

export default function VideoCall({ 
  appointmentId, 
  userId, 
  isDoctor, 
  onCallEnd 
}) {
  const [client] = useState(() => 
    AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
  );
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [error, setError] = useState('');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    initializeAgora();
    
    return () => {
      leaveCall();
    };
  }, []);

  const initializeAgora = async () => {
    try {
      // Get Agora token from cloud function
      const getToken = httpsCallable(functions, 'getAgoraToken');
      const { data } = await getToken({ 
        channel: appointmentId,
        uid: userId,
        role: isDoctor ? 'publisher' : 'subscriber'
      });

      if (!data.token) {
        throw new Error('Failed to get Agora token');
      }

      // Set up event handlers
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
      client.on('user-left', handleUserLeft);
      client.on('user-joined', handleUserJoined);

      // Join channel
      await client.join(data.appId, appointmentId, data.token, userId);
      
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
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
      setError('Failed to join video call. Please check your camera and microphone permissions.');
    }
  };

  const handleUserJoined = (user) => {
    console.log('User joined:', user.uid);
  };

  const handleUserPublished = async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    
    if (mediaType === 'video' && remoteVideoRef.current) {
      const remoteVideoTrack = user.videoTrack;
      remoteVideoTrack?.play(remoteVideoRef.current);
    }
    
    if (mediaType === 'audio') {
      const remoteAudioTrack = user.audioTrack;
      remoteAudioTrack?.play();
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

  const leaveCall = async () => {
    try {
      // Stop and close local tracks
      localAudioTrack?.stop();
      localAudioTrack?.close();
      localVideoTrack?.stop();
      localVideoTrack?.close();
      
      // Leave the channel
      await client.leave();
      
      setLocalAudioTrack(null);
      setLocalVideoTrack(null);
      setIsJoined(false);
      
      // Call the onCallEnd callback
      onCallEnd?.();
    } catch (error) {
      console.error('Error leaving call:', error);
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
                <VideoCameraOffIcon className="w-12 h-12" />
              </div>
              <p className="text-lg">Waiting for {isDoctor ? 'user' : 'doctor'} to join...</p>
            </div>
          )}
        </div>

        {/* Local Video - Picture in Picture */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div 
            ref={localVideoRef}
            className="w-full h-full"
          >
            {isVideoOff && (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <VideoCameraOffIcon className="w-8 h-8 text-white" />
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
              <MicrophoneOffIcon className="w-6 h-6 text-white" />
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
              <VideoCameraOffIcon className="w-6 h-6 text-white" />
            ) : (
              <VideoCameraIcon className="w-6 h-6 text-white" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={leaveCall}
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