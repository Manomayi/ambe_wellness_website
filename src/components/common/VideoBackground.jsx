'use client';
import React, { useEffect, useRef } from 'react';

export default function VideoBackground({
  src = '/videos/hero_background.mp4',
  className = 'absolute top-0 left-0 w-full h-full object-cover pointer-events-none',
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Autoplay was prevented or postponed by browser policy
          console.warn('VideoBackground autoplay deferred:', error?.message || error);
        });
      }
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className={className}
      onError={(e) => {
        console.error('Video failed to load:', e);
      }}
    />
  );
}

