'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Users, Activity, LogOut, Settings, Trash2, Megaphone, AlertOctagon, Smartphone } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // New State for Broadcast & Global Reset
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [globalResetting, setGlobalResetting] = useState(false);

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('team_login_id, current_room, has_started, inventory, active_session_id')
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

  // --- NEW FEATURES ---

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm(`CRITICAL WARNING: Are you sure you want to completely DELETE team "${teamId}" from the database?`)) return;
    
    setActionLoading(teamId);
    await supabase.from('teams').delete().eq('team_login_id', teamId);
    await fetchTeams();
    setActionLoading(null);
  };

  const handleResetDevice = async (teamId: string) => {
    if (!confirm(`Are you sure you want to disconnect ${teamId}'s device? They will be logged out immediately.`)) return;
    
    setActionLoading(teamId);
    await supabase.from('teams').update({ active_session_id: null }).eq('team_login_id', teamId);
    await fetchTeams();
    setActionLoading(null);
  };

  const handleGlobalPureReset = async () => {
    if (!confirm("GLOBAL RESET: Are you sure? This will wipe EVERY team's progress and return them ALL to the Standby screen!")) return;
    
    setGlobalResetting(true);
    // Supabase requires a filter for bulk updates, so we target all rows where team_login_id is not empty
    await supabase
      .from('teams')
      .update({
        has_started: false,
        current_room: null,
        inventory: [],
        visited_rooms: [],
        broadcast_message: null
      })
      .neq('team_login_id', '');
      
    await fetchTeams();
    setGlobalResetting(false);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    
    setBroadcasting(true);
    // Append a hidden timestamp so consecutive identical messages still register as a change on the client
    const payload = `${broadcastMsg.trim()} [T:${Date.now()}]`;
    
    await supabase
      .from('teams')
      .update({ broadcast_message: payload })
      .neq('team_login_id', '');
      
    setBroadcastMsg('');
    setBroadcasting(false);
    alert('Broadcast sent to all active devices!');
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

      {/* Admin Controls Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Broadcast Panel */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-sm font-bold text-zinc-400 tracking-widest mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-blue-500" /> SYSTEM BROADCAST
          </h2>
          <form onSubmit={handleBroadcast} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="Enter message to display on all participant screens..."
              className="flex-1 bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
              maxLength={100}
            />
            <button 
              type="submit" 
              disabled={broadcasting || !broadcastMsg.trim()}
              className="bg-blue-700 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-lg transition-colors tracking-widest text-sm disabled:opacity-50 whitespace-nowrap"
            >
              {broadcasting ? 'TRANSMITTING...' : 'SEND BROADCAST'}
            </button>
          </form>
        </div>

        {/* Danger Zone Panel */}
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
           <h2 className="text-sm font-bold text-red-500 tracking-widest mb-2 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" /> DANGER ZONE
          </h2>
          <p className="text-xs text-zinc-500 mb-4 font-mono">This action affects ALL registered teams simultaneously.</p>
          <button 
            onClick={handleGlobalPureReset}
            disabled={globalResetting}
            className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors tracking-widest text-sm shadow-[0_0_15px_rgba(220,38,38,0.4)] disabled:opacity-50"
          >
            {globalResetting ? 'PURGING SYSTEM...' : 'GLOBAL PURE RESET'}
          </button>
        </div>

      </div>

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
                  <td className="px-6 py-4 flex gap-2 items-center">
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
                      className="bg-amber-900/50 hover:bg-amber-700 text-amber-200 px-3 py-2 rounded text-[10px] font-bold tracking-widest transition-colors disabled:opacity-50"
                    >
                      PURE RESET
                    </button>
                    <button
                      onClick={() => handleResetDevice(team.team_login_id)}
                      disabled={actionLoading === team.team_login_id}
                      title="Reset Device Connection"
                      className="bg-purple-900/40 hover:bg-purple-700 text-purple-300 px-3 py-2 rounded text-[10px] font-bold tracking-widest transition-colors disabled:opacity-50 ml-1"
                    >
                      <Smartphone className="w-3 h-3 inline mr-1" /> KICK DEVICE
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.team_login_id)}
                      disabled={actionLoading === team.team_login_id}
                      title="Delete Team"
                      className="bg-red-900/40 hover:bg-red-700 text-red-400 hover:text-white p-2 rounded transition-colors disabled:opacity-50 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
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