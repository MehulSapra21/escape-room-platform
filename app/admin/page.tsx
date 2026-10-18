'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Users, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('team_login_id, current_room, has_started, inventory')
      .order('team_login_id', { ascending: true });

    if (!error && data) {
      setTeams(data);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    // Verify admin access
    const isAdmin = localStorage.getItem('is_admin');
    if (!isAdmin) {
      router.push('/');
      return;
    }

    // Initial fetch
    fetchTeams();
    setLoading(false);

    // Auto-refresh every 10 seconds to monitor team movements live
    const interval = setInterval(fetchTeams, 10000);
    return () => clearInterval(interval);
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black text-white p-6">LOADING OVERSEER TERMINAL...</div>;

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12">
      <header className="flex flex-col md:flex-row justify-between md:items-center border-b border-zinc-800 pb-4 mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-blue-500 tracking-widest flex items-center gap-3">
            <Activity className="animate-pulse" />
            OVERSEER TERMINAL
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">EVENT COMMAND & CONTROL CENTER</p>
        </div>
        <div className="text-left md:text-right">
          <span className="text-[10px] text-zinc-500 block tracking-widest">LAST SYNC</span>
          <span className="text-xs font-bold text-green-500 tracking-widest">{lastUpdated || 'SYNCING...'}</span>
        </div>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-950 text-zinc-400 font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Team ID
                </th>
                <th className="px-6 py-4 border-b border-zinc-800">Status</th>
                <th className="px-6 py-4 border-b border-zinc-800">Current Location</th>
                <th className="px-6 py-4 border-b border-zinc-800">Items Gathered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {teams.map((team) => (
                <tr key={team.team_login_id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-white font-mono">{team.team_login_id}</td>
                  <td className="px-6 py-4">
                    {team.has_started ? (
                      <span className="text-green-500 text-xs tracking-widest font-bold bg-green-950/30 px-2 py-1 rounded">ACTIVE</span>
                    ) : (
                      <span className="text-yellow-500 text-xs tracking-widest font-bold bg-yellow-950/30 px-2 py-1 rounded">STANDBY</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {team.current_room || 'WAITING FOR DEPLOYMENT'}
                  </td>
                  <td className="px-6 py-4 text-zinc-400 font-mono text-xs">
                    {team.inventory?.length || 0} / 8 slots filled
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 italic">
                    No teams detected in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}