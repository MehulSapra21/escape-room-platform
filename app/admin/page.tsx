'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Users, Activity, LogOut, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Track which team is currently being reset so we can show a loading state on their buttons
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
    const isAdmin = localStorage.getItem('is_admin');
    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchTeams();
    setLoading(false);

    const interval = setInterval(fetchTeams, 10000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('team_id');
    localStorage.removeItem('is_admin');
    router.push('/');
  };

  // Reset: Clears inventory & room, but keeps has_started = true so they skip the video
  const handlePartialReset = async (teamId: string) => {
    if (!confirm(`Are you sure you want to PARTIAL reset ${teamId}? They will skip the video but lose all items.`)) return;
    
    setActionLoading(teamId);
    await supabase
      .from('teams')
      .update({
        has_started: true,
        current_room: null,
        inventory: [],
        visited_rooms: []
      })
      .eq('team_login_id', teamId);
      
    await fetchTeams();
    setActionLoading(null);
  };

  // Reset: Clears everything, including has_started, forcing them back to standby/video
  const handlePureReset = async (teamId: string) => {
    if (!confirm(`Are you sure you want to PURE reset ${teamId}? They will start from the Standby screen.`)) return;
    
    setActionLoading(teamId);
    await supabase
      .from('teams')
      .update({
        has_started: false,
        current_room: null,
        inventory: [],
        visited_rooms: []
      })
      .eq('team_login_id', teamId);
      
    await fetchTeams();
    setActionLoading(null);
  };

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
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-zinc-500 block tracking-widest">LAST SYNC</span>
            <span className="text-xs font-bold text-green-500 tracking-widest">{lastUpdated || 'SYNCING...'}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition-colors text-xs font-bold tracking-widest"
          >
            <LogOut className="w-4 h-4" /> LOGOUT
          </button>
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
                <th className="px-6 py-4 border-b border-zinc-800 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Actions
                </th>
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
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handlePartialReset(team.team_login_id)}
                      disabled={actionLoading === team.team_login_id}
                      className="bg-blue-900/50 hover:bg-blue-700 text-blue-200 px-3 py-2 rounded text-[10px] font-bold tracking-widest transition-colors disabled:opacity-50"
                    >
                      PARTIAL RESET
                    </button>
                    <button
                      onClick={() => handlePureReset(team.team_login_id)}
                      disabled={actionLoading === team.team_login_id}
                      className="bg-red-900/50 hover:bg-red-700 text-red-200 px-3 py-2 rounded text-[10px] font-bold tracking-widest transition-colors disabled:opacity-50"
                    >
                      PURE RESET
                    </button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 italic">
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