'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function IntroPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  // Auto-redirect when the video finishes playing
  const handleVideoEnd = () => {
    router.push('/dashboard');
  };

  // Manual override for testing or if the video fails to load
  const handleSkip = () => {
    router.push('/dashboard');
  };

  useEffect(() => {
    // Ensure the user is logged in
    const teamId = localStorage.getItem('team_id');
    if (!teamId) {
      router.push('/');
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* 
        The video element looks for /intro.mp4 in the public folder.
        autoPlay starts it immediately.
      */}
      <video
        ref={videoRef}
        src="/intro.mp4"
        autoPlay
        playsInline
        onEnded={handleVideoEnd}
        onError={() => setVideoError(true)}
        className="w-full max-w-4xl h-auto max-h-screen object-contain shadow-2xl"
      />
      
      {videoError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center space-y-4 z-50">
          <p className="text-red-500 font-bold tracking-widest">TRANSMISSION FAILED (Video not found)</p>
          <button 
            onClick={handleSkip} 
            className="bg-red-700 hover:bg-red-600 px-6 py-4 rounded-lg font-bold transition-colors"
          >
            PROCEED TO DASHBOARD
          </button>
        </div>
      )}

      {/* A small skip button at the top right, highly useful for your testing phase */}
      <button 
        onClick={handleSkip}
        className="absolute top-6 right-6 text-zinc-600 text-xs tracking-widest hover:text-white transition-colors z-40"
      >
        SKIP TRANSMISSION
      </button>
    </main>
  );
}