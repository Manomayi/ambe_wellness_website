"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import AgoraRTC from "agora-rtc-sdk-ng";
import { auth } from "../../../../../lib/firebase";
import {
  CameraIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  PhoneXMarkIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
} from "@heroicons/react/24/solid";

export default function AppointmentPage() {
  const router = useRouter();
  const { id } = useParams(); // appointment id (unused for Agora UID)
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [joined, setJoined] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [currentCamIdx, setCurrentCamIdx] = useState(0);

  // draggable local preview
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  // toggles
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [muted, setMuted] = useState(false);

  const APP_ID = "5da06d9793194eb18bf1f343365871ca";
  const CHANNEL = "panacea_flutter";
  const TOKEN = null; // fetch and fill if you use a token

  // redirect if not authed
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return unsub;
  }, [router]);

  // Agora init & join
  useEffect(() => {
    let _client;
    let _audioTrack;
    let _videoTrack;

    const init = async () => {
      _client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(_client);

      // get camera list
      const cams = await AgoraRTC.getCameras();
      setCameraDevices(cams.map((c) => c.deviceId));

      // join channel (uid = 0 like your Flutter code)
      await _client.join(APP_ID, CHANNEL, TOKEN, 0);

      // create & publish tracks
      _audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      _videoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: cams[0].deviceId,
      });

      _videoTrack.play(localVideoRef.current);
      await _client.publish([_audioTrack, _videoTrack]);

      setLocalAudioTrack(_audioTrack);
      setLocalVideoTrack(_videoTrack);
      setJoined(true);

      // handle remote
      _client.on("user-published", async (user, mediaType) => {
        await _client.subscribe(user, mediaType);
        if (mediaType === "video") {
          user.videoTrack.play(remoteVideoRef.current);
        }
        if (mediaType === "audio") {
          user.audioTrack.play();
        }
      });

      _client.on("user-unpublished", (user, mediaType) => {
        if (mediaType === "video") {
          remoteVideoRef.current.innerHTML = "";
        }
      });
    };

    init();

    return () => {
      (async () => {
        if (_client) {
          if (_videoTrack) {
            await _client.unpublish([_videoTrack]);
            _videoTrack.stop();
            _videoTrack.close();
          }
          if (_audioTrack) {
            await _client.unpublish([_audioTrack]);
            _audioTrack.stop();
            _audioTrack.close();
          }
          await _client.leave();
        }
      })();
    };
  }, []);

  // draggable handlers
  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };
    const handleUp = () => setDragging(false);

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, dragOffset]);

  const onDragStart = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragging(true);
  };

  const switchCamera = async () => {
    if (!client || cameraDevices.length < 2) return;
    const next = (currentCamIdx + 1) % cameraDevices.length;
    setCurrentCamIdx(next);

    // unpublish old
    await client.unpublish([localVideoTrack]);
    localVideoTrack.stop();
    localVideoTrack.close();

    // create & publish new
    const newTrack = await AgoraRTC.createCameraVideoTrack({
      cameraId: cameraDevices[next],
    });
    newTrack.play(localVideoRef.current);
    await client.publish([newTrack]);
    setLocalVideoTrack(newTrack);
  };

  const toggleVideo = () => {
    if (!localVideoTrack) return;
    localVideoTrack.setEnabled(!videoEnabled);
    setVideoEnabled(!videoEnabled);
  };

  const toggleMute = () => {
    if (!localAudioTrack) return;
    localAudioTrack.setEnabled(muted);
    setMuted(!muted);
  };

  const leaveCall = () => {
    router.push("/member/consult");
  };

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Remote full-screen */}
      <div
        ref={remoteVideoRef}
        className="absolute inset-0 bg-black"
        style={{ objectFit: "cover" }}
      />

      {/* Draggable local preview */}
      {joined && (
        <div
          onPointerDown={onDragStart}
          className="absolute bg-black/50"
          style={{
            left: position.x,
            top: position.y,
            width: 100,
            height: 150,
            cursor: "move",
            zIndex: 10,
          }}
        >
          <div
            ref={localVideoRef}
            className="w-full h-full"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6 z-20">
        <button
          onClick={switchCamera}
          className="p-3 bg-gray-800 bg-opacity-60 rounded-full"
        >
          <CameraIcon className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={toggleVideo}
          className="p-3 bg-gray-800 bg-opacity-60 rounded-full"
        >
          {videoEnabled ? (
            <VideoCameraSlashIcon className="h-6 w-6 text-white" />
          ) : (
            <VideoCameraIcon className="h-6 w-6 text-white" />
          )}
        </button>

        <button
          onClick={leaveCall}
          className="p-3 bg-red-600 rounded-full"
        >
          <PhoneXMarkIcon className="h-6 w-6 text-white" />
        </button>

        <button
          onClick={toggleMute}
          className="p-3 bg-gray-800 bg-opacity-60 rounded-full"
        >
          {muted ? (
            <MicrophoneSlashIcon className="h-6 w-6 text-white" />
          ) : (
            <MicrophoneIcon className="h-6 w-6 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}