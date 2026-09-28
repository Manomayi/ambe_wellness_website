"use client";

import React, { useState, useEffect, useRef } from "react";

export default function BackgroundVideo({
  videoSrc = "/videos/opening_page_background.mp4",
  posterSrc = "/images/background/magnolia_flowers.jpg",
  opacity = 0.35,
  className = "",
}) {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Slight deferral allows main thread, React hydration, and button event listeners to finish first
    const timer = setTimeout(() => {
      setShouldLoadVideo(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (shouldLoadVideo && videoRef.current) {
      videoRef.current.playbackRate = 1.0;
      videoRef.current.play().catch(() => {
        // Autoplay may be deferred until interaction
      });
    }
  }, [shouldLoadVideo]);

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#141416] ${className}`}>
      {/* Instant fallback poster image */}
      <img
        src={posterSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        style={{
          opacity: isVideoReady ? 0 : opacity,
          transition: "opacity 0.6s ease-in-out",
        }}
      />

      {/* Looping silent HTML5 video matching Flutter BackgroundVideoWidget */}
      {shouldLoadVideo && (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={() => setIsVideoReady(true)}
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{
            opacity: isVideoReady ? opacity : 0,
            transition: "opacity 0.6s ease-in-out",
          }}
        />
      )}
    </div>
  );
}

