'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StandbyPage() {
  const [standbyCode, setStandbyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Ensure the team is actually logged in before showing the page
  useEffect(() => {
    const teamId = localStorage.getItem('team_id');
    if (!teamId) {
      router.push('/');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check against the environment variable we set earlier
    const correctCode = process.env.NEXT_PUBLIC_STANDBY_CODE;
    
    // Make it case-insensitive just in case teams type in lowercase
    if (standbyCode.toUpperCase() === correctCode) {
      // Correct code entered, move to the intro video
      router.push('/intro');
    } else {
      setError('INCORRECT CODE. WAITING FOR COMMENCEMENT.');
    }
  };

  if (!isAuthorized) return null;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-yellow-500 mb-2">STANDBY MODE</h1>
          <p className="text-zinc-400 text-sm">Please wait for the Event Coordinator to announce the commencement code.</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6 bg-zinc-900 p-6 rounded-xl border border-yellow-700/30 shadow-2xl">
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <input 
              type="text" 
              value={standbyCode}
              onChange={(e) => setStandbyCode(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-4 text-white focus:outline-none focus:border-yellow-500 transition-colors text-center uppercase tracking-widest font-mono"
              placeholder="ENTER CODE"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 rounded-lg transition-colors"
          >
            INITIALIZE EVENT
          </button>
        </form>
      </div>
    </main>
  );
}