'use client';

export default function VideoBackground({
  src = '/videos/hero_background.mp4',
  className = 'absolute top-0 left-0 w-full h-full object-cover',
}) {
  return (
    <video
      src={src}
      autoPlay
      loop
      muted
      playsInline
      className={className}
      onError={(e) => {
        console.error('Video failed to load:', e);
      }}
    />
  );
}
