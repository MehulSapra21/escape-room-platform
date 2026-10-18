'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Query Supabase for the team
    const { data, error: dbError } = await supabase
      .from('teams')
      .select('*')
      .eq('team_login_id', teamId)
      .eq('password', password)
      .single();

    if (dbError || !data) {
      setError('Invalid Team ID or Password. Access Denied.');
      setLoading(false);
      return;
    }

    // Store team UUID in local storage to track session
    localStorage.setItem('team_id', data.id);
    
    // Check if the team has already started the event
    if (data.has_started || data.current_room) {
      // Team is reconnecting mid-game, skip standby and intro video
      router.push('/dashboard');
    } else {
      // First-time login, send to standby gate
      router.push('/standby');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-widest text-red-600 mb-2">OUTBREAK</h1>
          <p className="text-zinc-400 text-sm">Secure Terminal Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-2xl">
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Team ID</label>
            <input 
              type="text" 
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-4 text-white focus:outline-none focus:border-red-600 transition-colors"
              placeholder="Enter Team ID"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Access Code</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-lg p-4 text-white focus:outline-none focus:border-red-600 transition-colors"
              placeholder="Enter Password"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER SYSTEM'}
          </button>
        </form>
      </div>
    </main>
  );
}