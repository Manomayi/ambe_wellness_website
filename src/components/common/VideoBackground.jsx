'use client';
import { useEffect, useState } from 'react';

export default function VideoBackground() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <video
        src="/videos/hero_background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        onLoadedData={() => setIsLoaded(true)}
      />
    </>
  );
}