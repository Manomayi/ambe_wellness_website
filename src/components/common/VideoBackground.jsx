'use client';

export default function VideoBackground() {
  return (
    <video
      src="/videos/hero_background.mp4"
      autoPlay
      loop
      muted
      playsInline
      className="absolute top-0 left-0 w-full h-full object-cover"
      onError={(e) => {
        console.error('Video failed to load:', e);
      }}
    />
  );
}