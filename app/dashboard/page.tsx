'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Fingerprint, FlaskConical, LogOut } from 'lucide-react';

const INITIAL_ROOMS = ['HOSPITAL', 'PHARMACY', 'MILITARY BASE', 'SCIENTIST LAB'];
const FINAL_ROOM = 'PARTICIPANT LAB';
const TOTAL_INVENTORY_SLOTS = 8;

const ROOM_CODES: Record<string, Record<string, { item: string; isCritical: boolean }>> = {
  'HOSPITAL': { 
    'HOSP123': { item: 'Viral Culture', isCritical: true },
    'MEDKIT99': { item: 'First Aid Kit', isCritical: false }
  },
  'PHARMACY': { 
    'PHAR456': { item: 'Chemical Solvent', isCritical: true },
    'PILLS01': { item: 'Adrenaline Shot', isCritical: false }
  },
  'MILITARY BASE': { 
    'MIL789': { item: 'Stabilizing Isotope', isCritical: true },
    'KEYCARD': { item: 'Access Card', isCritical: false }
  },
  'SCIENTIST LAB': { 
    'LAB000': { item: 'Catalyst Enzyme', isCritical: true },
    'NOTES55': { item: 'Research Logs', isCritical: false }
  },
};

export default function DashboardPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [roomCode, setRoomCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    const initDashboard = async () => {
      const teamId = localStorage.getItem('team_id');
      if (!teamId) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error || !data) {
        router.push('/');
        return;
      }

      if (!data.current_room) {
        const { data: allTeams } = await supabase.from('teams').select('current_room');
        const roomCounts = INITIAL_ROOMS.reduce((acc, room) => {
          acc[room] = 0;
          return acc;
        }, {} as Record<string, number>);

        allTeams?.forEach((t) => {
          if (t.current_room && roomCounts[t.current_room] !== undefined) {
            roomCounts[t.current_room]++;
          }
        });

        let assignedRoom = INITIAL_ROOMS[0];
        let minCount = roomCounts[assignedRoom];
        
        for (const room of INITIAL_ROOMS) {
          if (roomCounts[room] < minCount) {
            minCount = roomCounts[room];
            assignedRoom = room;
          }
        }

        const { data: updatedData, error: updateError } = await supabase
          .from('teams')
          .update({ current_room: assignedRoom, has_started: true })
          .eq('id', teamId)
          .select()
          .single();
        
        if (!updateError && updatedData) setTeam(updatedData);
        else setTeam(data);
      } else {
        setTeam(data);
      }
      
      setLoading(false);
    };

    initDashboard();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('team_id');
    localStorage.removeItem('is_admin');
    router.push('/');
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    
    setCodeLoading(true);
    setMessage(null);

    if (team.current_room === FINAL_ROOM) {
       setMessage({ text: "All components acquired. Synthesize the antidote.", type: "success" });
       setCodeLoading(false);
       return;
    }

    const availableCodesForRoom = ROOM_CODES[team.current_room];
    const discoveredItem = availableCodesForRoom ? availableCodesForRoom[roomCode] : null;

    if (discoveredItem) {
      if (team.inventory?.includes(discoveredItem.item)) {
        setMessage({ text: "ITEM ALREADY IN INVENTORY.", type: "error" });
        setCodeLoading(false);
        return;
      }

      const newInventory = [...(team.inventory || []), discoveredItem.item];

      if (discoveredItem.isCritical) {
        const newVisitedRooms = [...(team.visited_rooms || []), team.current_room];
        const remainingRooms = INITIAL_ROOMS.filter(r => !newVisitedRooms.includes(r));
        let nextRoom = FINAL_ROOM;

        if (remainingRooms.length > 0) {
          const { data: allTeams } = await supabase.from('teams').select('current_room');
          const roomCounts = remainingRooms.reduce((acc, room) => {
            acc[room] = 0;
            return acc;
          }, {} as Record<string, number>);

          allTeams?.forEach((t) => {
            if (t.current_room && roomCounts[t.current_room] !== undefined) {
              roomCounts[t.current_room]++;
            }
          });

          nextRoom = remainingRooms[0];
          let minCount = roomCounts[nextRoom];
          
          for (const room of remainingRooms) {
            if (roomCounts[room] < minCount) {
              minCount = roomCounts[room];
              nextRoom = room;
            }
          }
        }

        const { data: updatedTeam, error: updateError } = await supabase
          .from('teams')
          .update({
            inventory: newInventory,
            visited_rooms: newVisitedRooms,
            current_room: nextRoom
          })
          .eq('id', team.id)
          .select()
          .single();

        if (!updateError && updatedTeam) {
          setTeam(updatedTeam);
          setRoomCode('');
          setMessage({ text: `CRITICAL ITEM ACQUIRED: ${discoveredItem.item}. Routing to next sector...`, type: "success" });
        } else {
          setMessage({ text: "Database sync failed. Try again.", type: "error" });
        }
      } else {
        const { data: updatedTeam, error: updateError } = await supabase
          .from('teams')
          .update({
            inventory: newInventory
          })
          .eq('id', team.id)
          .select()
          .single();

        if (!updateError && updatedTeam) {
          setTeam(updatedTeam);
          setRoomCode('');
          setMessage({ text: `ITEM ACQUIRED: ${discoveredItem.item}. Keep searching for the critical component.`, type: "success" });
        } else {
          setMessage({ text: "Database sync failed. Try again.", type: "error" });
        }
      }
    } else {
      setMessage({ text: "INVALID CODE FOR CURRENT SECTOR.", type: "error" });
    }

    setCodeLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-yellow-500 flex items-center justify-center font-mono text-sm tracking-widest text-center px-4">
        CALCULATING OPTIMAL DEPLOYMENT ROUTE...
      </div>
    );
  }

  const inventorySlots = Array.from({ length: TOTAL_INVENTORY_SLOTS });
  const currentInventory = team.inventory || [];
  const isFinalRoom = team.current_room === FINAL_ROOM;

  return (
    <main className="min-h-screen bg-black text-white p-6 pb-24">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-red-600 tracking-widest">OUTBREAK OS</h1>
          <p className="text-xs text-zinc-500 font-mono">TEAM: {team.team_login_id}</p>
        </div>
        <div className="text-right flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="text-zinc-500 hover:text-white transition-colors"
            title="Disconnect Terminal"
          >
            <LogOut className="w-5 h-5" />
          </button>
          {isFinalRoom ? (
            <FlaskConical className="text-blue-500 w-5 h-5 animate-pulse" />
          ) : (
            <ShieldAlert className="text-red-600 w-5 h-5" />
          )}
        </div>
      </header>

      {/* Current Objective Display */}
      <div className={`border rounded-xl p-6 shadow-2xl mb-8 relative overflow-hidden ${isFinalRoom ? 'bg-blue-950/20 border-blue-900/50' : 'bg-zinc-900 border-zinc-700'}`}>
        <div className={`absolute top-0 left-0 w-1 h-full ${isFinalRoom ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
        <h2 className="text-xs text-zinc-400 mb-2 tracking-widest font-semibold uppercase">Current Location Target</h2>
        <p className={`text-3xl font-black tracking-wider uppercase mb-3 ${isFinalRoom ? 'text-blue-400' : 'text-white'}`}>
          {team.current_room}
        </p>
        <p className="text-sm text-zinc-400">
          {isFinalRoom 
            ? "You have gathered all critical components. Proceed to the lab immediately to synthesize the final antidote." 
            : "Infiltrate this sector. Search for items and extract the critical component code to proceed."}
        </p>
      </div>

      {/* Code Entry Interface */}
      {!isFinalRoom && (
        <div className="mb-8">
          <form onSubmit={handleCodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ENTER TERMINAL CODE"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-colors uppercase font-mono tracking-widest text-sm"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={codeLoading}
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {codeLoading ? '...' : 'VERIFY'}
            </button>
          </form>
          {message && (
            <p className={`mt-3 text-xs font-mono tracking-wide ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {message.text}
            </p>
          )}
        </div>
      )}

      {/* Inventory System */}
      <div>
        <h2 className="text-xs text-zinc-500 mb-3 tracking-widest font-semibold uppercase">Inventory Cache</h2>
        <div className="grid grid-cols-4 gap-3">
          {inventorySlots.map((_, index) => {
            const item = currentInventory[index];
            return (
              <div 
                key={index} 
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center p-2 text-center transition-all duration-500 ${
                  item 
                    ? 'bg-zinc-800/80 border-green-600/50 shadow-[0_0_15px_rgba(22,163,74,0.15)] scale-100' 
                    : 'bg-black border-zinc-800/50 scale-95'
                }`}
              >
                {item ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center mb-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <span className="text-[9px] font-bold text-green-500 tracking-wider uppercase truncate w-full">
                      {item}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-zinc-800 font-mono">EMPTY</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}