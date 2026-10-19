'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Fingerprint, FlaskConical, LogOut, X, Search, Link, Trash2 } from 'lucide-react';

const INITIAL_ROOMS = ['HOSPITAL', 'PHARMACY', 'MILITARY BASE', 'SCIENTIST LAB'];
const FINAL_ROOM = 'PARTICIPANT LAB';
const TOTAL_INVENTORY_SLOTS = 8;

const ROOM_CODES: Record<string, Record<string, { item: string; isCritical: boolean }>> = {
  'HOSPITAL': { 
    'HOSP123': { item: 'Viral Culture', isCritical: true },
    'MEDKIT99': { item: 'First Aid Kit', isCritical: false }
  },
  'PHARMACY': { 
    'PHAR456': { item: 'Chemical Solvent', isCritical: false }, // No longer critical, Component B is
    'PILLS01': { item: 'Adrenaline Shot', isCritical: false },
    'LABCOAT004': { item: 'Lab Coat', isCritical: false },
    'CHESS005': { item: 'Chess Puzzle', isCritical: false },
    'COMPONENT-B-006': { item: 'Component-B Box', isCritical: false }
  },
  'MILITARY BASE': { 
    'MIL789': { item: 'Stabilizing Isotope', isCritical: false }, // No longer critical, Component C is
    'KEYCARD': { item: 'Access Card', isCritical: false },
    'JACKET001': { item: 'Soldier Jacket', isCritical: false },
    'POSTER002': { item: 'Crime Scene Poster', isCritical: false },
    'COMPONENT-C-003': { item: 'Component-C Box', isCritical: false }
  },
  'SCIENTIST LAB': { 
    'LAB000': { item: 'Catalyst Enzyme', isCritical: true },
    'NOTES55': { item: 'Research Logs', isCritical: false }
  },
};

const ITEM_IMAGES: Record<string, string> = {
  'Soldier Jacket': '/jacket.jpg',
  'Crime Scene Poster': '/crime_scene_poster.jpg',
  'Component-C Box': '/component_c_box.jpg',
  'Component C': '/component_c.jpg',
  'Lab Coat': '/lab_coat.jpg',
  'Chess Puzzle': '/chess.jpg',
  'Component-B Box': '/component_c_box.jpg', // Reusing the box image
  'Component B': '/component_b.jpg'          // The actual component
};

const EXAMINE_IMAGES: Record<string, string> = {
  'Soldier Jacket': '/soldier_note.jpg',
};

const POSTER_ANSWER_KEY: Record<string, string> = {
  A: '7', B: '3', C: '11', D: '1', E: '9', F: '4',
  G: '12', H: '2', I: '8', J: '6', K: '10', L: '5'
};

const CHESS_ANSWER_KEY = {
  L1: 'Bishop', L2: 'Rook', L3: 'Knight',
  R1: 'Pawn', R2: 'Queen', R3: 'King'
};
const CHESS_PIECES = ['Bishop', 'Rook', 'Queen', 'King'];

const BOX_PASSCODE = '4716';    // Military Base Component C Passcode
const BOX_B_PASSCODE = '8250';  // Pharmacy Component B Passcode (Change this later!)

export default function DashboardPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [roomCode, setRoomCode] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Inventory Interaction State
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [examineImage, setExamineImage] = useState<string | null>(null);
  const [itemActionMessage, setItemActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Puzzle States
  const [showPosterPuzzle, setShowPosterPuzzle] = useState(false);
  const [posterAnswers, setPosterAnswers] = useState<Record<string, string>>({});
  const [posterMessage, setPosterMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const [showChessPuzzle, setShowChessPuzzle] = useState(false);
  const [chessAnswers, setChessAnswers] = useState<Record<string, string>>({
    L1: '', L2: '', L3: 'Knight', R1: 'Pawn', R2: '', R3: ''
  });
  const [chessMessage, setChessMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Component C Box State
  const [showBoxPuzzle, setShowBoxPuzzle] = useState(false);
  const [boxCodeArr, setBoxCodeArr] = useState(['', '', '', '']);
  const [boxMessage, setBoxMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [boxLoading, setBoxLoading] = useState(false);

  // Component B Box State
  const [showBoxBPuzzle, setShowBoxBPuzzle] = useState(false);
  const [boxBCodeArr, setBoxBCodeArr] = useState(['', '', '', '']);
  const [boxBMessage, setBoxBMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [boxBLoading, setBoxBLoading] = useState(false);

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
        const assignedRoom = 'PHARMACY'; // Temporary override for testing
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

    const syncInterval = setInterval(async () => {
      const teamId = localStorage.getItem('team_id');
      if (!teamId) return;

      const { data, error } = await supabase
        .from('teams')
        .select('has_started, current_room')
        .eq('id', teamId)
        .single();

      if (!error && data) {
        if (!data.has_started) {
          router.push('/standby');
        } else if (data.has_started && !data.current_room) {
          window.location.reload();
        }
      }
    }, 5000);

    return () => clearInterval(syncInterval);
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

      if ((team.inventory || []).length >= TOTAL_INVENTORY_SLOTS) {
        setMessage({ text: "INVENTORY FULL, DISCARD AN ITEM.", type: "error" });
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

  const handleExamine = () => {
    if (!selectedItem) return;

    if (selectedItem === 'Crime Scene Poster') {
      setShowPosterPuzzle(true);
      setItemActionMessage(null);
      setPosterMessage(null);
      setPosterAnswers({});
      return;
    }

    if (selectedItem === 'Component-C Box') {
      setShowBoxPuzzle(true);
      setItemActionMessage(null);
      setBoxMessage(null);
      setBoxCodeArr(['', '', '', '']);
      return;
    }

    if (selectedItem === 'Component-B Box') {
      setShowBoxBPuzzle(true);
      setItemActionMessage(null);
      setBoxBMessage(null);
      setBoxBCodeArr(['', '', '', '']);
      return;
    }

    if (selectedItem === 'Chess Puzzle') {
      setShowChessPuzzle(true);
      setItemActionMessage(null);
      setChessMessage(null);
      setChessAnswers({ L1: '', L2: '', L3: 'Knight', R1: 'Pawn', R2: '', R3: '' });
      return;
    }

    if (selectedItem === 'Lab Coat') {
      setItemActionMessage("NOTE FOUND: 4 uftu uvcft xfsf vtfe");
      return;
    }

    const imageSrc = EXAMINE_IMAGES[selectedItem];
    if (imageSrc) {
      setExamineImage(imageSrc);
      setItemActionMessage(null);
      setTimeout(() => {
        setExamineImage(null);
      }, 5000);
    } else {
      setItemActionMessage("Nothing of interest found on this item.");
    }
  };

  const handleCombine = () => {
    setItemActionMessage("This item can not be combined with anything.");
  };

  const handleDiscard = async () => {
    if (!team || !selectedItem) return;

    // Items that can NEVER be discarded
    const nonDiscardable = ['Component-C Box', 'Component C', 'Component-B Box', 'Component B'];
    if (nonDiscardable.includes(selectedItem)) {
      setItemActionMessage("This item can not be discarded.");
      return;
    }

    // Room completion dependencies for discarding
    const hasClearedMilitaryBase = team.visited_rooms?.includes('MILITARY BASE');
    const hasClearedPharmacy = team.visited_rooms?.includes('PHARMACY');

    if (selectedItem === 'Soldier Jacket' || selectedItem === 'Crime Scene Poster') {
      if (!hasClearedMilitaryBase) {
        setItemActionMessage("This item can not be discarded right now.");
        return;
      }
    }

    if (selectedItem === 'Lab Coat' || selectedItem === 'Chess Puzzle') {
      if (!hasClearedPharmacy) {
        setItemActionMessage("This item can not be discarded right now.");
        return;
      }
    }

    setActionLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== selectedItem);
    
    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update({ inventory: newInventory })
      .eq('id', team.id)
      .select()
      .single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setSelectedItem(null);
      setItemActionMessage(null);
    } else {
      setItemActionMessage("Database sync failed.");
    }
    setActionLoading(false);
  };

  const handlePosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let isCorrect = true;
    for (const letter in POSTER_ANSWER_KEY) {
      if (posterAnswers[letter] !== POSTER_ANSWER_KEY[letter]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setPosterMessage({ 
        text: "7 may be a part of the key. The soldier hid a part of the key under the desk.", 
        type: 'success' 
      });
    } else {
      setPosterMessage({ 
        text: "INCORRECT ANALYSIS. VERIFY YOUR PARTS.", 
        type: 'error' 
      });
    }
  };

  const handleChessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let isCorrect = true;
    
    for (const position in CHESS_ANSWER_KEY) {
      if (chessAnswers[position] !== CHESS_ANSWER_KEY[position as keyof typeof CHESS_ANSWER_KEY]) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      setChessMessage({ 
        text: "Uif uijse ejhju jt 5", 
        type: 'success' 
      });
    } else {
      setChessMessage({ 
        text: "INCORRECT PLACEMENT. LOCK REMAINS ENGAGED.", 
        type: 'error' 
      });
    }
  };

  // Logic for Component C Box
  const handleBoxChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newArr = [...boxCodeArr];
    newArr[index] = value.slice(-1);
    setBoxCodeArr(newArr);
    
    if (value && index < 3) {
      document.getElementById(`box-input-${index + 1}`)?.focus();
    }
  };

  const handleBoxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = boxCodeArr.join('');
    
    if (enteredCode !== BOX_PASSCODE) {
      setBoxMessage({ text: "ACCESS DENIED. INVALID PASSCODE.", type: "error" });
      return;
    }

    setBoxLoading(true);
    
    const newInventory = team.inventory.filter((i: string) => i !== 'Component-C Box');
    newInventory.push('Component C');

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
      setShowBoxPuzzle(false);
      setSelectedItem(null);
      setMessage({ text: `CRITICAL ITEM ACQUIRED: Component C. Routing to next sector...`, type: "success" });
    } else {
      setBoxMessage({ text: "Database sync failed. Try again.", type: "error" });
    }
    setBoxLoading(false);
  };

  // Logic for Component B Box
  const handleBoxBChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newArr = [...boxBCodeArr];
    newArr[index] = value.slice(-1);
    setBoxBCodeArr(newArr);
    
    if (value && index < 3) {
      document.getElementById(`box-b-input-${index + 1}`)?.focus();
    }
  };

  const handleBoxBSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = boxBCodeArr.join('');
    
    if (enteredCode !== BOX_B_PASSCODE) {
      setBoxBMessage({ text: "ACCESS DENIED. INVALID PASSCODE.", type: "error" });
      return;
    }

    setBoxBLoading(true);
    
    const newInventory = team.inventory.filter((i: string) => i !== 'Component-B Box');
    newInventory.push('Component B');

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
      setShowBoxBPuzzle(false);
      setSelectedItem(null);
      setMessage({ text: `CRITICAL ITEM ACQUIRED: Component B. Routing to next sector...`, type: "success" });
    } else {
      setBoxBMessage({ text: "Database sync failed. Try again.", type: "error" });
    }
    setBoxBLoading(false);
  };

  const closeMenu = () => {
    setSelectedItem(null);
    setItemActionMessage(null);
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
    <main className="min-h-screen bg-black text-white p-6 pb-24 relative">
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

      {!isFinalRoom && (
        <div className="mb-8">
          <form onSubmit={handleCodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="TYPE CODE"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-4 pl-12 pr-4 text-white focus:outline-none focus:border-red-600 transition-colors uppercase font-mono tracking-widest text-sm"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={codeLoading}
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {codeLoading ? '...' : 'ADD ITEM'}
            </button>
          </form>
          {message && (
            <p className={`mt-3 text-xs font-mono tracking-wide ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
              {message.text}
            </p>
          )}
        </div>
      )}

      <div>
        <h2 className="text-3xl font-black text-blue-500 mb-4 tracking-wider uppercase">INVENTORY</h2>
        <div className="grid grid-cols-4 gap-3">
          {inventorySlots.map((_, index) => {
            const item = currentInventory[index];
            const hasImage = item && ITEM_IMAGES[item];

            return (
              <button 
                key={index} 
                onClick={() => item && setSelectedItem(item)}
                disabled={!item}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center transition-all duration-500 overflow-hidden outline-none ${
                  item 
                    ? 'bg-zinc-800/80 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.35)] scale-100 hover:scale-105 cursor-pointer' 
                    : 'bg-black border-blue-800/60 scale-95 cursor-default'
                }`}
              >
                {item ? (
                  hasImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={ITEM_IMAGES[item]} 
                      alt={item} 
                      className="w-full h-full object-contain rounded-md"
                    />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center mb-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                      </div>
                      <span className="text-[9px] font-bold text-blue-400 tracking-wider uppercase truncate w-full px-1">
                        {item}
                      </span>
                    </>
                  )
                ) : (
                  <span className="text-[10px] text-zinc-800 font-mono">EMPTY</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Item Interaction Menu Overlay */}
      {selectedItem && !examineImage && !showPosterPuzzle && !showBoxPuzzle && !showChessPuzzle && !showBoxBPuzzle && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 fade-in sm:zoom-in">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h3 className="font-black text-blue-500 tracking-wider uppercase">{selectedItem}</h3>
              <button onClick={closeMenu} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-2 flex flex-col gap-2">
              {itemActionMessage && (
                <div className="p-3 mb-2 bg-zinc-950 border border-zinc-800 rounded text-xs font-mono text-yellow-500 text-center">
                  {itemActionMessage}
                </div>
              )}
              
              <button 
                onClick={handleExamine}
                className="flex items-center gap-3 w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-bold tracking-widest text-sm"
              >
                <Search className="w-5 h-5 text-blue-400" /> EXAMINE
              </button>
              
              <button 
                onClick={handleCombine}
                className="flex items-center gap-3 w-full p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors font-bold tracking-widest text-sm"
              >
                <Link className="w-5 h-5 text-green-400" /> COMBINE
              </button>
              
              <button 
                onClick={handleDiscard}
                disabled={actionLoading}
                className="flex items-center gap-3 w-full p-4 bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 rounded-xl transition-colors font-bold tracking-widest text-sm disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" /> {actionLoading ? 'DISCARDING...' : 'DISCARD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component-B Box 4-Digit Lock Overlay */}
      {showBoxBPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in">
            <button 
              onClick={() => { setShowBoxBPuzzle(false); setBoxBMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-red-500 mb-6 uppercase tracking-widest text-center">Enter Passcode</h3>
            
            {boxBMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${boxBMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {boxBMessage.text}
              </div>
            )}
            
            <form onSubmit={handleBoxBSubmit}>
              <div className="flex justify-center gap-3 mb-8">
                {boxBCodeArr.map((digit, index) => (
                  <input 
                    key={index}
                    id={`box-b-input-${index}`}
                    type="text" 
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleBoxBChange(index, e.target.value)}
                    className="w-14 h-16 bg-black border-2 border-zinc-700 rounded-lg text-center text-white text-3xl font-bold focus:border-red-500 outline-none transition-colors font-mono shadow-inner"
                  />
                ))}
              </div>
              <button 
                type="submit" 
                disabled={boxBLoading}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50"
              >
                {boxBLoading ? 'DECRYPTING...' : 'UNLOCK BOX'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Component-C Box 4-Digit Lock Overlay */}
      {showBoxPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in">
            <button 
              onClick={() => { setShowBoxPuzzle(false); setBoxMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-red-500 mb-6 uppercase tracking-widest text-center">Enter Passcode</h3>
            
            {boxMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${boxMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {boxMessage.text}
              </div>
            )}
            
            <form onSubmit={handleBoxSubmit}>
              <div className="flex justify-center gap-3 mb-8">
                {boxCodeArr.map((digit, index) => (
                  <input 
                    key={index}
                    id={`box-input-${index}`}
                    type="text" 
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleBoxChange(index, e.target.value)}
                    className="w-14 h-16 bg-black border-2 border-zinc-700 rounded-lg text-center text-white text-3xl font-bold focus:border-red-500 outline-none transition-colors font-mono shadow-inner"
                  />
                ))}
              </div>
              <button 
                type="submit" 
                disabled={boxLoading}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50"
              >
                {boxLoading ? 'DECRYPTING...' : 'UNLOCK BOX'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chess Plug Puzzle Overlay */}
      {showChessPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button 
              onClick={() => { setShowChessPuzzle(false); setChessMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest text-center">Assign Plugs</h3>
            
            {chessMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${chessMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {chessMessage.text}
              </div>
            )}
            
            <form onSubmit={handleChessSubmit}>
              <div className="flex justify-between gap-4 mb-8">
                <div className="flex-1 space-y-4">
                  <h4 className="text-zinc-500 font-bold text-xs uppercase tracking-widest text-center border-b border-zinc-800 pb-2">Left Wall</h4>
                  {['L1', 'L2', 'L3'].map((pos) => (
                    pos === 'L3' ? (
                      <div key={pos} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-500 text-center font-bold tracking-widest opacity-70">
                        KNIGHT
                      </div>
                    ) : (
                      <select 
                        key={pos}
                        value={chessAnswers[pos]}
                        onChange={(e) => setChessAnswers({...chessAnswers, [pos]: e.target.value})}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        required
                      >
                        <option value="" disabled>Select Piece</option>
                        {CHESS_PIECES.map(piece => <option key={piece} value={piece}>{piece}</option>)}
                      </select>
                    )
                  ))}
                </div>

                <div className="flex-1 space-y-4">
                  <h4 className="text-zinc-500 font-bold text-xs uppercase tracking-widest text-center border-b border-zinc-800 pb-2">Right Wall</h4>
                  {['R1', 'R2', 'R3'].map((pos) => (
                    pos === 'R1' ? (
                      <div key={pos} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-500 text-center font-bold tracking-widest opacity-70">
                        PAWN
                      </div>
                    ) : (
                      <select 
                        key={pos}
                        value={chessAnswers[pos]}
                        onChange={(e) => setChessAnswers({...chessAnswers, [pos]: e.target.value})}
                        className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        required
                      >
                        <option value="" disabled>Select Piece</option>
                        {CHESS_PIECES.map(piece => <option key={piece} value={piece}>{piece}</option>)}
                      </select>
                    )
                  ))}
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest"
              >
                CONFIRM PLACEMENT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Poster Puzzle Form Overlay */}
      {showPosterPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 relative animate-in zoom-in my-auto mt-20 sm:mt-auto">
            <button 
              onClick={() => { setShowPosterPuzzle(false); setPosterMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest">Analyze Image Parts</h3>
            
            {posterMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed ${posterMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {posterMessage.text}
              </div>
            )}
            
            <form onSubmit={handlePosterSubmit}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
                {Object.keys(POSTER_ANSWER_KEY).map(letter => (
                  <div key={letter} className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">{letter}</label>
                    <input 
                      type="text" 
                      maxLength={2}
                      value={posterAnswers[letter] || ''}
                      onChange={(e) => setPosterAnswers({...posterAnswers, [letter]: e.target.value.trim()})}
                      className="bg-black border border-zinc-700 rounded-lg p-3 text-center text-white focus:border-blue-500 outline-none transition-colors font-mono"
                    />
                  </div>
                ))}
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest"
              >
                VERIFY CONFIGURATION
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Examine Image Overlay (For other items) */}
      {examineImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-md">
          <div className="relative w-full h-full p-4 flex flex-col items-center justify-center animate-in zoom-in duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={examineImage} 
              alt="Examined Item Detail" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-zinc-800"
            />
            <div className="absolute bottom-10 left-0 w-full text-center">
              <span className="text-zinc-500 font-mono text-xs tracking-widest uppercase animate-pulse">
                ANALYZING DOCUMENT...
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}