'use client';
import { useEffect, useState } from 'react';

export default function VideoBackground() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('VideoBackground component mounted');
  }, []);

  return (
    <>
      <video
        src="/videos/hero_background.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        onLoadedData={() => {
          console.log('Video loaded successfully');
          setIsLoaded(true);
        }}
        onError={(e) => {
          console.error('Video failed to load:', e);
        }}
        onPlay={() => console.log('Video started playing')}
      />
    </>
  );
}