'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Fingerprint, FlaskConical, LogOut, X, Search, Link, Trash2 } from 'lucide-react';
import ScientistLabUI from '../../components/ScientistLabUI';

const INITIAL_ROOMS = ['HOSPITAL', 'PHARMACY', 'MILITARY BASE', 'SCIENTIST LAB'];
const FINAL_ROOM = 'PARTICIPANT LAB';
const TOTAL_INVENTORY_SLOTS = 8;

const ROOM_CODES: Record<string, Record<string, { item: string; isCritical: boolean }>> = {
  'HOSPITAL': { 
    'HOSP123': { item: 'Viral Culture', isCritical: false },
    'MEDKIT99': { item: 'First Aid Kit', isCritical: false },
    'IVBAG008': { item: 'IV Bag', isCritical: false },
    'TESTTUBE009': { item: 'Test Tube', isCritical: false },
    'CARDS010': { item: 'Cards', isCritical: false },
    'COMPONENT-A-011': { item: 'Component-A Box', isCritical: false }
  },
  'PHARMACY': { 
    'PHAR456': { item: 'Chemical Solvent', isCritical: false }, 
    'PILLS01': { item: 'Adrenaline Shot', isCritical: false },
    'LABCOAT004': { item: 'Lab Coat', isCritical: false },
    'CHESS005': { item: 'Chess Puzzle', isCritical: false },
    'COMPONENT-B-006': { item: 'Component-B Box', isCritical: false }
  },
  'MILITARY BASE': { 
    'MIL789': { item: 'Stabilizing Isotope', isCritical: false }, 
    'KEYCARD': { item: 'Access Card', isCritical: false },
    'JACKET001': { item: 'Soldier Jacket', isCritical: false },
    'POSTER002': { item: 'Crime Scene Poster', isCritical: false },
    'COMPONENT-C-003': { item: 'Component-C Box', isCritical: false }
  },
  'SCIENTIST LAB': { 
    'LAB000': { item: 'Catalyst Enzyme', isCritical: false },
    'NOTES55': { item: 'Research Logs', isCritical: false },
    'CHART012': { item: 'Blood Chart', isCritical: false },
    'SLIDER013': { item: 'Chem Tube', isCritical: false },
    'IPAD014': { item: 'Locked iPad', isCritical: false },
    'COMPONENT-D-015': { item: 'Component-D Box', isCritical: false }
  },
};

const ITEM_IMAGES: Record<string, string> = {
  'Soldier Jacket': '/jacket.jpg',
  'Crime Scene Poster': '/crime_scene_poster.jpg',
  'Component-C Box': '/component_c_box.jpg',
  'Component C': '/component_c.jpg',
  'Lab Coat': '/lab_coat.jpg',
  'Chess Puzzle': '/chess.jpg',
  'Component-B Box': '/component_c_box.jpg', 
  'Component B': '/component_b.jpg',
  'IV Bag': '/iv_bag.jpg',
  'IV Bag (Decoded)': '/iv_bag.jpg',
  'Test Tube': '/test_tube.jpg',
  'Serum': '/serum.jpg',
  'Serum (Decoded)': '/serum.jpg',
  'Cards': '/cards.jpg',
  'Cards (Decoded)': '/cards.jpg',
  'Component-A Box': '/component_c_box.jpg',
  'Component A': '/component_a.jpg',
  'Blood Chart': '/blood_chart.jpg',
  'Blood Chart (Decoded)': '/blood_chart.jpg',
  'Chem Tube': '/chem_tube.jpg',
  'Chem Tube (Decoded)': '/chem_tube.jpg',
  'Locked iPad': '/ipad.jpg',
  'Unlocked iPad': '/ipad.jpg',
  'Component-D Box': '/component_c_box.jpg',
  'Component D': '/component_d.jpg',
  'Antidote': '/antidote.jpg'
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

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const TUBE_CAPACITIES = [8, 5, 3];

const BOX_PASSCODE = '4716';    
const BOX_B_PASSCODE = '8250';  
const BOX_A_PASSCODE = '3244';
const IPAD_PASSCODE = '9158';
const BOX_D_PASSCODE = '7355';

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

  const [showIVBagPuzzle, setShowIVBagPuzzle] = useState(false);
  const [ivBagAnswers, setIvBagAnswers] = useState<string[]>(['', '', '', '']);
  const [ivBagMessage, setIvBagMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [ivBagLoading, setIvBagLoading] = useState(false);

  const [showBloodPuzzle, setShowBloodPuzzle] = useState(false);
  const [bloodAnswers, setBloodAnswers] = useState<string[]>(['', '']);
  const [bloodMessage, setBloodMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [bloodLoading, setBloodLoading] = useState(false);

  const [showSerumPuzzle, setShowSerumPuzzle] = useState(false);
  const [serumTubes, setSerumTubes] = useState([8, 0, 0]);
  const [serumMessage, setSerumMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [serumLoading, setSerumLoading] = useState(false);

  const [showCardsPuzzle, setShowCardsPuzzle] = useState(false);
  const [cardsAnswers, setCardsAnswers] = useState<string[]>(['', '', '', '']);
  const [cardsMessage, setCardsMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Scientist Lab Puzzles
  const [showChartPuzzle, setShowChartPuzzle] = useState(false);
  const [chartGrid, setChartGrid] = useState<boolean[]>(Array(9).fill(false));
  const [chartMessage, setChartMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [chartLoading, setChartLoading] = useState(false);

  const [showSliderPuzzle, setShowSliderPuzzle] = useState(false);
  const [sliderValues, setSliderValues] = useState<number[]>([0, 0, 0]);
  const [sliderMessage, setSliderMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [sliderLoading, setSliderLoading] = useState(false);

  const [showIpadPuzzle, setShowIpadPuzzle] = useState(false);
  const [ipadCodeArr, setIpadCodeArr] = useState(['', '', '', '']);
  const [ipadMessage, setIpadMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [ipadLoading, setIpadLoading] = useState(false);

  const [showBoxDPuzzle, setShowBoxDPuzzle] = useState(false);
  const [boxDCodeArr, setBoxDCodeArr] = useState(['', '', '', '']);
  const [boxDMessage, setBoxDMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [boxDLoading, setBoxDLoading] = useState(false);

  // Component Boxes (Previous)
  const [showBoxPuzzle, setShowBoxPuzzle] = useState(false);
  const [boxCodeArr, setBoxCodeArr] = useState(['', '', '', '']);
  const [boxMessage, setBoxMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [boxLoading, setBoxLoading] = useState(false);

  const [showBoxBPuzzle, setShowBoxBPuzzle] = useState(false);
  const [boxBCodeArr, setBoxBCodeArr] = useState(['', '', '', '']);
  const [boxBMessage, setBoxBMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [boxBLoading, setBoxBLoading] = useState(false);

  const [showBoxAPuzzle, setShowBoxAPuzzle] = useState(false);
  const [boxACodeArr, setBoxACodeArr] = useState(['', '', '', '']);
  const [boxAMessage, setBoxAMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
  const [boxALoading, setBoxALoading] = useState(false);

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
        const assignedRoom = 'SCIENTIST LAB'; // TEMPORARILY OVERRIDDEN TO TEST SCIENTIST LAB
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
      setShowPosterPuzzle(true); setItemActionMessage(null); setPosterMessage(null); setPosterAnswers({}); return;
    }
    if (selectedItem === 'Component-C Box') {
      setShowBoxPuzzle(true); setItemActionMessage(null); setBoxMessage(null); setBoxCodeArr(['', '', '', '']); return;
    }
    if (selectedItem === 'Component-B Box') {
      setShowBoxBPuzzle(true); setItemActionMessage(null); setBoxBMessage(null); setBoxBCodeArr(['', '', '', '']); return;
    }
    if (selectedItem === 'Component-A Box') {
      setShowBoxAPuzzle(true); setItemActionMessage(null); setBoxAMessage(null); setBoxACodeArr(['', '', '', '']); return;
    }
    if (selectedItem === 'Component-D Box') {
      setShowBoxDPuzzle(true); setItemActionMessage(null); setBoxDMessage(null); setBoxDCodeArr(['', '', '', '']); return;
    }
    if (selectedItem === 'Chess Puzzle') {
      setShowChessPuzzle(true); setItemActionMessage(null); setChessMessage(null); setChessAnswers({ L1: '', L2: '', L3: 'Knight', R1: 'Pawn', R2: '', R3: '' }); return;
    }
    if (selectedItem === 'IV Bag') {
      setShowIVBagPuzzle(true); setItemActionMessage(null); setIvBagMessage(null); setIvBagAnswers(['', '', '', '']); return;
    }
    if (selectedItem === 'IV Bag (Decoded)') {
      setItemActionMessage("SEQUENCE VERIFIED. EXTRACTED KEY: 2"); return;
    }
    if (selectedItem === 'Test Tube') {
      setShowBloodPuzzle(true); setItemActionMessage(null); setBloodMessage(null); setBloodAnswers(['', '']); return;
    }
    if (selectedItem === 'Serum') {
      setShowSerumPuzzle(true); setItemActionMessage(null); setSerumMessage(null); setSerumTubes([8, 0, 0]); return;
    }
    if (selectedItem === 'Serum (Decoded)') {
      setItemActionMessage("SYNTHESIS COMPLETE. EXTRACTED KEY: 4"); return;
    }
    if (selectedItem === 'Cards') {
      setShowCardsPuzzle(true); setItemActionMessage(null); setCardsMessage(null); setCardsAnswers(['', '', '', '']); return;
    }
    if (selectedItem === 'Cards (Decoded)') {
      setItemActionMessage("SEQUENCE VERIFIED. EXTRACTED KEY: 4"); return;
    }
    if (selectedItem === 'Blood Chart') {
      setShowChartPuzzle(true); setItemActionMessage(null); setChartMessage(null); setChartGrid(Array(9).fill(false)); return;
    }
    if (selectedItem === 'Blood Chart (Decoded)') {
      setItemActionMessage("PATTERN RECOGNIZED. KEY PART 1: 9"); return;
    }
    if (selectedItem === 'Chem Tube') {
      setShowSliderPuzzle(true); setItemActionMessage(null); setSliderMessage(null); setSliderValues([0, 0, 0]); return;
    }
    if (selectedItem === 'Chem Tube (Decoded)') {
      setItemActionMessage("CALIBRATION PERFECT. KEY PART 2: 1"); return;
    }
    if (selectedItem === 'Locked iPad') {
      setShowIpadPuzzle(true); setItemActionMessage(null); setIpadMessage(null); setIpadCodeArr(['', '', '', '']); return;
    }
    if (selectedItem === 'Unlocked iPad') {
      setItemActionMessage("the passcode for the component box is 7355"); return;
    }
    if (selectedItem === 'Antidote') {
      setItemActionMessage("THE FINAL ANTIDOTE. ESCAPE THE FACILITY IMMEDIATELY."); return;
    }
    if (selectedItem === 'Lab Coat') {
      setItemActionMessage("NOTE FOUND: 4 uftu uvcft xfsf vtfe"); return;
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

  const handleCombine = async () => {
    if (!team || !selectedItem) return;

    const criticalComponents = ['Component A', 'Component B', 'Component C', 'Component D'];
    
    // Check if the user is trying to combine one of the components
    if (criticalComponents.includes(selectedItem)) {
      const hasAllComponents = criticalComponents.every(comp => (team.inventory || []).includes(comp));
      
      if (hasAllComponents) {
        setActionLoading(true);
        // Remove all 4 components and add the Antidote
        const newInventory = team.inventory.filter((i: string) => !criticalComponents.includes(i));
        newInventory.push('Antidote');

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
          setMessage({ text: "ANTIDOTE SYNTHESIZED SUCCESSFULLY.", type: "success" });
        } else {
          setItemActionMessage("Database sync failed.");
        }
        setActionLoading(false);
        return;
      } else {
        setItemActionMessage("SYNTHESIS FAILED. ALL 4 COMPONENTS REQUIRED.");
        return;
      }
    }

    setItemActionMessage("This item can not be combined with anything.");
  };

  const handleDiscard = async () => {
    if (!team || !selectedItem) return;

    // Items that can NEVER be discarded
    const nonDiscardable = ['Component-C Box', 'Component C', 'Component-B Box', 'Component B', 'Component-A Box', 'Component A', 'Component-D Box', 'Component D', 'Antidote'];
    if (nonDiscardable.includes(selectedItem)) {
      setItemActionMessage("This item can not be discarded.");
      return;
    }

    // Room completion dependencies for discarding
    const hasClearedMilitaryBase = team.visited_rooms?.includes('MILITARY BASE');
    const hasClearedPharmacy = team.visited_rooms?.includes('PHARMACY');
    const hasClearedHospital = team.visited_rooms?.includes('HOSPITAL');
    const hasClearedScientistLab = team.visited_rooms?.includes('SCIENTIST LAB');

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

    if (['IV Bag', 'IV Bag (Decoded)', 'Test Tube', 'Serum', 'Serum (Decoded)', 'Cards', 'Cards (Decoded)'].includes(selectedItem)) {
      if (!hasClearedHospital) {
        setItemActionMessage("This item can not be discarded right now.");
        return;
      }
    }

    if (['Blood Chart', 'Blood Chart (Decoded)', 'Chem Tube', 'Chem Tube (Decoded)', 'Locked iPad', 'Unlocked iPad'].includes(selectedItem)) {
      if (!hasClearedScientistLab) {
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

  // Logic for Blood Types Combination
  const handleBloodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodAnswers[0] || !bloodAnswers[1]) {
      setBloodMessage({ text: "SELECT TWO BLOOD TYPES.", type: 'error' });
      return;
    }

    const isCorrect = bloodAnswers.includes('A+') && bloodAnswers.includes('O-');
    if (!isCorrect) {
      setBloodMessage({ text: "INCOMPATIBLE BLOOD TYPES. REACTION FAILED.", type: 'error' });
      return;
    }

    setBloodLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== 'Test Tube');
    newInventory.push('Serum');

    const { data: updatedTeam, error } = await supabase
      .from('teams').update({ inventory: newInventory }).eq('id', team.id).select().single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setShowBloodPuzzle(false);
      setSelectedItem('Serum');
      setItemActionMessage("TEST TUBES COMBINED SUCCESSFULLY INTO SERUM.");
    } else {
      setBloodMessage({ text: "Database sync failed.", type: "error" });
    }
    setBloodLoading(false);
  };

  // Logic for RE2 Serum Fluid Transfer
  const handleSerumPour = async (fromIdx: number, toIdx: number) => {
    if (serumLoading) return;
    if (fromIdx === toIdx) return;

    const newTubes = [...serumTubes];
    const amount = Math.min(newTubes[fromIdx], TUBE_CAPACITIES[toIdx] - newTubes[toIdx]);
    
    if (amount === 0) return;

    newTubes[fromIdx] -= amount;
    newTubes[toIdx] += amount;
    setSerumTubes(newTubes);

    if (newTubes.includes(4)) {
      setSerumLoading(true);
      setSerumMessage({ text: "TARGET VOLUME REACHED! DECODING...", type: 'success' });

      const newInventory = team.inventory.filter((i: string) => i !== 'Serum');
      newInventory.push('Serum (Decoded)');

      const { data: updatedTeam, error } = await supabase
        .from('teams').update({ inventory: newInventory }).eq('id', team.id).select().single();

      if (!error && updatedTeam) {
        setTeam(updatedTeam);
        setTimeout(() => {
          setShowSerumPuzzle(false);
          setSelectedItem('Serum (Decoded)');
          setItemActionMessage("SYNTHESIS COMPLETE. EXTRACTED KEY: 4");
          setSerumLoading(false);
        }, 1500);
      } else {
        setSerumMessage({ text: "Database sync failed.", type: "error" });
        setSerumLoading(false);
      }
    }
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

  const handleIVBagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const enteredSequence = ivBagAnswers.join('');
    if (enteredSequence !== 'CDBA') {
      setIvBagMessage({ text: "INCORRECT ADMISSION SEQUENCE.", type: 'error' });
      return;
    }

    setIvBagLoading(true);
    
    const newInventory = team.inventory.filter((i: string) => i !== 'IV Bag');
    newInventory.push('IV Bag (Decoded)');

    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update({ inventory: newInventory })
      .eq('id', team.id)
      .select()
      .single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setShowIVBagPuzzle(false);
      setSelectedItem('IV Bag (Decoded)');
      setItemActionMessage("SEQUENCE VERIFIED. EXTRACTED KEY: 2");
    } else {
      setIvBagMessage({ text: "Database sync failed.", type: "error" });
    }
    setIvBagLoading(false);
  };

  const handleCardsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cardsAnswers.join('') !== 'BGRY') {
      setCardsMessage({ text: "INCORRECT COLOR SEQUENCE.", type: 'error' });
      return;
    }

    setCardsLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== 'Cards');
    newInventory.push('Cards (Decoded)');

    const { data: updatedTeam, error } = await supabase
      .from('teams').update({ inventory: newInventory }).eq('id', team.id).select().single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setShowCardsPuzzle(false);
      setSelectedItem('Cards (Decoded)');
      setItemActionMessage("SEQUENCE VERIFIED. EXTRACTED KEY: 4");
    } else {
      setCardsMessage({ text: "Database sync failed.", type: "error" });
    }
    setCardsLoading(false);
  };

  const handleChartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 'M' shape indices: 0, 2, 3, 4, 5, 6, 8 (true), 1, 7 (false)
    const targetM = [true, false, true, true, true, true, true, false, true];
    const isCorrect = chartGrid.every((val, index) => val === targetM[index]);

    if (!isCorrect) {
      setChartGrid(Array(9).fill(false));
      setChartMessage({ text: "INCORRECT PATTERN DETECTED. RESETTING.", type: 'error' });
      return;
    }

    setChartLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== 'Blood Chart');
    newInventory.push('Blood Chart (Decoded)');

    const { data: updatedTeam, error } = await supabase
      .from('teams').update({ inventory: newInventory }).eq('id', team.id).select().single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setShowChartPuzzle(false);
      setSelectedItem('Blood Chart (Decoded)');
      setItemActionMessage("PATTERN RECOGNIZED. KEY PART 1: 9");
    } else {
      setChartMessage({ text: "Database sync failed.", type: "error" });
    }
    setChartLoading(false);
  };

  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sliderValues[0] !== 40 || sliderValues[1] !== 70 || sliderValues[2] !== 20) {
      setSliderMessage({ text: "CALIBRATION FAILED. CHECK CHEMICAL PROPERTIES.", type: 'error' });
      return;
    }

    setSliderLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== 'Chem Tube');
    newInventory.push('Chem Tube (Decoded)');

    const { data: updatedTeam, error } = await supabase
      .from('teams').update({ inventory: newInventory }).eq('id', team.id).select().single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setShowSliderPuzzle(false);
      setSelectedItem('Chem Tube (Decoded)');
      setItemActionMessage("CALIBRATION PERFECT. KEY PART 2: 1");
    } else {
      setSliderMessage({ text: "Database sync failed.", type: "error" });
    }
    setSliderLoading(false);
  };

  // Logic for Locked iPad
  const handleIpadChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newArr = [...ipadCodeArr];
    newArr[index] = value.slice(-1);
    setIpadCodeArr(newArr);
    if (value && index < 3) document.getElementById(`ipad-input-${index + 1}`)?.focus();
  };

  const handleIpadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = ipadCodeArr.join('');
    if (enteredCode !== IPAD_PASSCODE) {
      setIpadMessage({ text: "ACCESS DENIED. INVALID PASSCODE.", type: "error" });
      return;
    }

    setIpadLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== 'Locked iPad');
    newInventory.push('Unlocked iPad');

    const { data: updatedTeam, error } = await supabase
      .from('teams').update({ inventory: newInventory }).eq('id', team.id).select().single();

    if (!error && updatedTeam) {
      setTeam(updatedTeam);
      setShowIpadPuzzle(false);
      setSelectedItem('Unlocked iPad');
      setItemActionMessage("the passcode for the component box is 7355");
    } else {
      setIpadMessage({ text: "Database sync failed.", type: "error" });
    }
    setIpadLoading(false);
  };

  // Logic for Component D Box
  const handleBoxDChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newArr = [...boxDCodeArr];
    newArr[index] = value.slice(-1);
    setBoxDCodeArr(newArr);
    if (value && index < 3) document.getElementById(`box-d-input-${index + 1}`)?.focus();
  };

  const handleBoxDSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = boxDCodeArr.join('');
    if (enteredCode !== BOX_D_PASSCODE) {
      setBoxDMessage({ text: "ACCESS DENIED. INVALID PASSCODE.", type: "error" });
      return;
    }

    setBoxDLoading(true);
    const newInventory = team.inventory.filter((i: string) => i !== 'Component-D Box');
    newInventory.push('Component D');

    const newVisitedRooms = [...(team.visited_rooms || []), team.current_room];
    const remainingRooms = INITIAL_ROOMS.filter(r => !newVisitedRooms.includes(r));
    let nextRoom = FINAL_ROOM;

    if (remainingRooms.length > 0) {
      const { data: allTeams } = await supabase.from('teams').select('current_room');
      const roomCounts = remainingRooms.reduce((acc, room) => { acc[room] = 0; return acc; }, {} as Record<string, number>);
      allTeams?.forEach((t) => { if (t.current_room && roomCounts[t.current_room] !== undefined) roomCounts[t.current_room]++; });
      nextRoom = remainingRooms[0];
      let minCount = roomCounts[nextRoom];
      for (const room of remainingRooms) { if (roomCounts[room] < minCount) { minCount = roomCounts[room]; nextRoom = room; } }
    }

    const { data: updatedTeam, error: updateError } = await supabase
      .from('teams').update({ inventory: newInventory, visited_rooms: newVisitedRooms, current_room: nextRoom })
      .eq('id', team.id).select().single();

    if (!updateError && updatedTeam) {
      setTeam(updatedTeam);
      setShowBoxDPuzzle(false);
      setSelectedItem(null);
      setMessage({ text: `CRITICAL ITEM ACQUIRED: Component D. Routing to next sector...`, type: "success" });
    } else {
      setBoxDMessage({ text: "Database sync failed. Try again.", type: "error" });
    }
    setBoxDLoading(false);
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

  // Logic for Component A Box
  const handleBoxAChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newArr = [...boxACodeArr];
    newArr[index] = value.slice(-1);
    setBoxACodeArr(newArr);
    
    if (value && index < 3) {
      document.getElementById(`box-a-input-${index + 1}`)?.focus();
    }
  };

  const handleBoxASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = boxACodeArr.join('');
    
    if (enteredCode !== BOX_A_PASSCODE) {
      setBoxAMessage({ text: "ACCESS DENIED. INVALID PASSCODE.", type: "error" });
      return;
    }

    setBoxALoading(true);
    
    const newInventory = team.inventory.filter((i: string) => i !== 'Component-A Box');
    newInventory.push('Component A');

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
      setShowBoxAPuzzle(false);
      setSelectedItem(null);
      setMessage({ text: `CRITICAL ITEM ACQUIRED: Component A. Routing to next sector...`, type: "success" });
    } else {
      setBoxAMessage({ text: "Database sync failed. Try again.", type: "error" });
    }
    setBoxALoading(false);
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
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6 relative z-10">
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

      {/* DYNAMIC ROOM RENDERING */}
      {team.current_room === 'SCIENTIST LAB' ? (
        <ScientistLabUI 
          team={team}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          handleCodeSubmit={handleCodeSubmit}
          codeLoading={codeLoading}
          message={message}
          inventorySlots={inventorySlots}
          currentInventory={currentInventory}
          ITEM_IMAGES={ITEM_IMAGES}
          setSelectedItem={setSelectedItem}
        />
      ) : (
        <>
          {/* STANDARD UI FOR ALL OTHER ROOMS */}
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
        </>
      )}

      {/* Item Interaction Menu Overlay */}
      {selectedItem && !examineImage && !showPosterPuzzle && !showBoxPuzzle && !showChessPuzzle && !showBoxBPuzzle && !showBoxAPuzzle && !showIVBagPuzzle && !showBloodPuzzle && !showSerumPuzzle && !showCardsPuzzle && !showChartPuzzle && !showSliderPuzzle && !showIpadPuzzle && !showBoxDPuzzle && (
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

      {/* Scientist Lab Chart Puzzle */}
      {showChartPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button onClick={() => { setShowChartPuzzle(false); setChartMessage(null); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest text-center">Analyze Pattern</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">Recreate the visual anomaly found on the chart.</p>
            {chartMessage && <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${chartMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>{chartMessage.text}</div>}
            
            <form onSubmit={handleChartSubmit}>
              <div className="grid grid-cols-3 gap-2 mb-8 mx-auto w-48 h-48">
                {chartGrid.map((val, index) => (
                  <div 
                    key={index} 
                    onClick={() => {
                      const newGrid = [...chartGrid];
                      newGrid[index] = !newGrid[index];
                      setChartGrid(newGrid);
                    }}
                    className={`w-full h-full border-2 rounded-md cursor-pointer transition-colors ${val ? 'bg-white border-white' : 'bg-black border-zinc-700 hover:border-zinc-500'}`}
                  />
                ))}
              </div>
              <button type="submit" disabled={chartLoading} className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50">
                {chartLoading ? 'VERIFYING...' : 'CONFIRM PATTERN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scientist Lab Slider Puzzle */}
      {showSliderPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button onClick={() => { setShowSliderPuzzle(false); setSliderMessage(null); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-green-500 mb-6 uppercase tracking-widest text-center">Calibrate Spectrometer</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">Adjust parameters to match the chemical signature.</p>
            {sliderMessage && <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${sliderMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>{sliderMessage.text}</div>}
            
            <form onSubmit={handleSliderSubmit}>
              <div className="flex flex-col gap-6 mb-8">
                {['ACIDITY', 'TOXICITY', 'DENSITY'].map((label, index) => (
                  <div key={label} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold font-mono text-zinc-400">
                      <span>{label}</span>
                      <span className="text-white">{sliderValues[index]}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5" value={sliderValues[index]}
                      onChange={(e) => {
                        const newVals = [...sliderValues];
                        newVals[index] = parseInt(e.target.value);
                        setSliderValues(newVals);
                      }}
                      className="w-full accent-green-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              <button type="submit" disabled={sliderLoading} className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50">
                {sliderLoading ? 'CALIBRATING...' : 'ANALYZE SAMPLE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Locked iPad Overlay */}
      {showIpadPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in">
            <button onClick={() => { setShowIpadPuzzle(false); setIpadMessage(null); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest text-center">iPad Security</h3>
            {ipadMessage && <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${ipadMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>{ipadMessage.text}</div>}
            <form onSubmit={handleIpadSubmit}>
              <div className="flex justify-center gap-3 mb-8">
                {ipadCodeArr.map((digit, index) => (
                  <input key={index} id={`ipad-input-${index}`} type="text" maxLength={1} value={digit} onChange={(e) => handleIpadChange(index, e.target.value)} className="w-14 h-16 bg-black border-2 border-zinc-700 rounded-lg text-center text-white text-3xl font-bold focus:border-blue-500 outline-none transition-colors font-mono shadow-inner" />
                ))}
              </div>
              <button type="submit" disabled={ipadLoading} className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50">
                {ipadLoading ? 'UNLOCKING...' : 'ENTER PASSCODE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Component-D Box 4-Digit Lock Overlay */}
      {showBoxDPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in">
            <button onClick={() => { setShowBoxDPuzzle(false); setBoxDMessage(null); }} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-red-500 mb-6 uppercase tracking-widest text-center">Enter Passcode</h3>
            {boxDMessage && <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${boxDMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>{boxDMessage.text}</div>}
            <form onSubmit={handleBoxDSubmit}>
              <div className="flex justify-center gap-3 mb-8">
                {boxDCodeArr.map((digit, index) => (
                  <input key={index} id={`box-d-input-${index}`} type="text" maxLength={1} value={digit} onChange={(e) => handleBoxDChange(index, e.target.value)} className="w-14 h-16 bg-black border-2 border-zinc-700 rounded-lg text-center text-white text-3xl font-bold focus:border-red-500 outline-none transition-colors font-mono shadow-inner" />
                ))}
              </div>
              <button type="submit" disabled={boxDLoading} className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50">
                {boxDLoading ? 'DECRYPTING...' : 'UNLOCK BOX'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hospital Symptom Cards Puzzle */}
      {showCardsPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button 
              onClick={() => { setShowCardsPuzzle(false); setCardsMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest text-center">Arrange Symptom Cards</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">Arrange the colored cards by urgency time.</p>
            
            {cardsMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${cardsMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {cardsMessage.text}
              </div>
            )}
            
            <form onSubmit={handleCardsSubmit}>
              <div className="flex justify-between gap-2 mb-8">
                {['1st', '2nd', '3rd', '4th'].map((label, index) => (
                  <div key={index} className="flex-1 flex flex-col gap-2">
                    <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest text-center">{label}</label>
                    <select 
                      value={cardsAnswers[index]} 
                      onChange={(e) => { 
                        const newAns = [...cardsAnswers]; 
                        newAns[index] = e.target.value; 
                        setCardsAnswers(newAns); 
                      }}
                      className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none text-center font-bold" 
                      required
                    >
                      <option value="" disabled>-</option>
                      {['B', 'G', 'R', 'Y'].map(opt => (
                        <option key={opt} value={opt}>
                          {opt === 'B' ? 'Blue' : opt === 'G' ? 'Green' : opt === 'R' ? 'Red' : 'Yellow'}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button 
                type="submit" 
                disabled={cardsLoading} 
                className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50"
              >
                {cardsLoading ? 'VERIFYING...' : 'VERIFY SEQUENCE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hospital Test Tube Blood Puzzle */}
      {showBloodPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button 
              onClick={() => { setShowBloodPuzzle(false); setBloodMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest text-center">Analyze Blood</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">Select the two infected blood types to initiate synthesis.</p>
            
            {bloodMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${bloodMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {bloodMessage.text}
              </div>
            )}
            
            <form onSubmit={handleBloodSubmit}>
              <div className="flex flex-col gap-4 mb-8">
                {[0, 1].map(idx => (
                  <select 
                    key={idx} 
                    value={bloodAnswers[idx]} 
                    onChange={(e) => { 
                      const newAns = [...bloodAnswers]; 
                      newAns[idx] = e.target.value; 
                      setBloodAnswers(newAns); 
                    }}
                    className="w-full bg-black border border-zinc-700 rounded-lg p-4 text-white focus:border-blue-500 outline-none font-bold" 
                    required
                  >
                    <option value="" disabled>Select Blood Sample {idx + 1}</option>
                    {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                ))}
              </div>
              <button 
                type="submit" 
                disabled={bloodLoading} 
                className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50"
              >
                {bloodLoading ? 'SYNTHESIZING...' : 'BEGIN SYNTHESIS'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hospital RE2 Serum Puzzle */}
      {showSerumPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button 
              onClick={() => { setShowSerumPuzzle(false); setSerumMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-green-500 mb-2 uppercase tracking-widest text-center">Fluid Transfer</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">Transfer serum between cartridges to reach exactly <strong className="text-white">4 ml</strong>.</p>
            
            {serumMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${serumMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {serumMessage.text}
              </div>
            )}
            
            <div className="flex justify-center gap-6 mb-8 pt-4">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="text-zinc-500 font-mono text-xs mb-2 font-bold">MAX: {TUBE_CAPACITIES[idx]}</div>
                  <div className="w-16 h-48 bg-zinc-950 border-2 border-zinc-700 rounded-b-xl relative overflow-hidden flex items-end shadow-inner">
                    <div 
                      className="w-full bg-green-500/80 transition-all duration-500 ease-in-out" 
                      style={{ height: `${(serumTubes[idx] / TUBE_CAPACITIES[idx]) * 100}%` }} 
                    />
                    {idx === 0 && <div className="absolute w-full border-t-[3px] border-red-600 z-10 opacity-80" style={{ bottom: '50%' }} />}
                  </div>
                  <div className="text-white font-black text-lg mt-3 bg-black px-4 py-1 rounded border border-zinc-800">
                    {serumTubes[idx]}
                  </div>
                  <div className="flex flex-col gap-2 mt-4 w-full">
                     {[0, 1, 2].map(targetIdx => (
                        targetIdx !== idx && (
                           <button 
                             key={targetIdx} 
                             onClick={() => handleSerumPour(idx, targetIdx)}
                             disabled={serumTubes[idx] === 0 || serumTubes[targetIdx] === TUBE_CAPACITIES[targetIdx] || serumLoading}
                             className="w-full bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg text-xs font-bold tracking-widest disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                           >
                             POUR TO {targetIdx + 1}
                           </button>
                        )
                     ))}
                  </div>
                </div>
              ))}
            </div>
            {serumLoading && (
              <div className="text-center font-mono text-xs text-green-500 animate-pulse tracking-widest">
                ANALYZING VOLUME...
              </div>
            )}
          </div>
        </div>
      )}

      {/* IV Bag Puzzle Overlay */}
      {showIVBagPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl p-6 relative animate-in zoom-in my-auto">
            <button 
              onClick={() => { setShowIVBagPuzzle(false); setIvBagMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-blue-500 mb-6 uppercase tracking-widest text-center">Arrange IV Bags</h3>
            <p className="text-xs text-zinc-400 text-center mb-6">Arrange patient bags by order of admission.</p>
            
            {ivBagMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${ivBagMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {ivBagMessage.text}
              </div>
            )}
            
            <form onSubmit={handleIVBagSubmit}>
              <div className="flex justify-between gap-2 mb-8">
                {['1st', '2nd', '3rd', '4th'].map((label, index) => (
                  <div key={index} className="flex-1 flex flex-col gap-2">
                    <label className="text-zinc-500 font-bold text-xs uppercase tracking-widest text-center">{label}</label>
                    <select 
                      value={ivBagAnswers[index]}
                      onChange={(e) => {
                        const newAns = [...ivBagAnswers];
                        newAns[index] = e.target.value;
                        setIvBagAnswers(newAns);
                      }}
                      className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none text-center font-bold"
                      required
                    >
                      <option value="" disabled>-</option>
                      {['A', 'B', 'C', 'D'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              
              <button 
                type="submit" 
                disabled={ivBagLoading}
                className="w-full bg-blue-700 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50"
              >
                {ivBagLoading ? 'VERIFYING...' : 'VERIFY SEQUENCE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Component-A Box 4-Digit Lock Overlay */}
      {showBoxAPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm rounded-2xl p-6 relative animate-in zoom-in">
            <button 
              onClick={() => { setShowBoxAPuzzle(false); setBoxAMessage(null); }} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-red-500 mb-6 uppercase tracking-widest text-center">Enter Passcode</h3>
            
            {boxAMessage && (
              <div className={`p-4 mb-6 rounded-lg font-mono text-sm leading-relaxed text-center ${boxAMessage.type === 'success' ? 'bg-green-950/50 text-green-400 border border-green-900' : 'bg-red-950/50 text-red-400 border border-red-900'}`}>
                {boxAMessage.text}
              </div>
            )}
            
            <form onSubmit={handleBoxASubmit}>
              <div className="flex justify-center gap-3 mb-8">
                {boxACodeArr.map((digit, index) => (
                  <input 
                    key={index}
                    id={`box-a-input-${index}`}
                    type="text" 
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleBoxAChange(index, e.target.value)}
                    className="w-14 h-16 bg-black border-2 border-zinc-700 rounded-lg text-center text-white text-3xl font-bold focus:border-red-500 outline-none transition-colors font-mono shadow-inner"
                  />
                ))}
              </div>
              <button 
                type="submit" 
                disabled={boxALoading}
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-xl transition-colors tracking-widest disabled:opacity-50"
              >
                {boxALoading ? 'DECRYPTING...' : 'UNLOCK BOX'}
              </button>
            </form>
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