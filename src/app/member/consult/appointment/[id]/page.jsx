// src/app/member/consult/appointment/[id]/page.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
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
  const { id } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const agoraSDK = useRef(null);

  const [client, setClient] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [joined, setJoined] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [currentCamIdx, setCurrentCamIdx] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [muted, setMuted] = useState(false);

  const APP_ID = "5da06d9793194eb18bf1f343365871ca";
  const CHANNEL = "panacea_flutter";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/login");
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    let _client;
    let _audioTrack;
    let _videoTrack;

    const init = async () => {
      const { default: AgoraRTC } = await import("agora-rtc-sdk-ng");
      agoraSDK.current = AgoraRTC;

      _client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      setClient(_client);

      const infoSnap = await getDoc(doc(db, "agora", "info"));
      const token = infoSnap.exists() ? infoSnap.data().token : null;

      const cams = await AgoraRTC.getCameras();
      setCameraDevices(cams.map((c) => c.deviceId));

      await _client.join(APP_ID, CHANNEL, token, Number(id));

      _audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      _videoTrack = await AgoraRTC.createCameraVideoTrack({
        cameraId: cams[0].deviceId,
      });

      _videoTrack.play(localVideoRef.current);
      await _client.publish([_audioTrack, _videoTrack]);

      setLocalAudioTrack(_audioTrack);
      setLocalVideoTrack(_videoTrack);
      setJoined(true);

      _client.on("user-published", async (user, mediaType) => {
        await _client.subscribe(user, mediaType);
        if (mediaType === "video") user.videoTrack.play(remoteVideoRef.current);
        if (mediaType === "audio") user.audioTrack.play();
      });

      _client.on("user-unpublished", (_, mediaType) => {
        if (mediaType === "video") remoteVideoRef.current.innerHTML = "";
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
  }, [id]);

  const switchCamera = async () => {
    if (!client || cameraDevices.length < 2) return;
    const next = (currentCamIdx + 1) % cameraDevices.length;
    setCurrentCamIdx(next);

    await client.unpublish([localVideoTrack]);
    localVideoTrack.stop();
    localVideoTrack.close();

    const AgoraRTC = agoraSDK.current;
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
      <div
        ref={remoteVideoRef}
        className="absolute inset-0 bg-black"
        style={{ objectFit: "cover" }}
      />
      <div
        className="absolute top-4 right-4 w-24 h-36 bg-black/50"
        style={{ display: joined ? "block" : "none" }}
      >
        <div
          ref={localVideoRef}
          className="w-full h-full"
          style={{ objectFit: "cover" }}
        />
      </div>
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