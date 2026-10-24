import { Fingerprint, Biohazard, Activity, FileWarning, Search, Skull } from 'lucide-react';

export default function HospitalUI({ team, roomCode, setRoomCode, handleCodeSubmit, codeLoading, message, inventorySlots, currentInventory, ITEM_IMAGES, setSelectedItem }: any) {
  return (
    <div className="relative animate-in fade-in zoom-in-95 duration-700">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
      
      <div className="border border-red-900/40 bg-black/80 rounded-xl p-6 shadow-2xl mb-8 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-2 h-full bg-red-700 animate-pulse"></div>
        
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xs text-red-500 mb-2 tracking-[0.4em] font-black flex items-center gap-2 animate-pulse">
              <Biohazard className="w-4 h-4" /> QUARANTINE ZONE BREACHED
            </h2>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2 text-white drop-shadow-[0_0_15px_rgba(220,38,38,0.6)]">
              DAY 14: NO CURE
            </h1>
            <p className="text-sm text-red-400 font-mono tracking-widest">LOCATION: {team.current_room}</p>
          </div>
          <Activity className="w-16 h-16 text-red-600/30 animate-bounce" />
        </div>
        <div className="mt-6 p-4 bg-red-950/30 border-l-2 border-red-800 text-xs text-red-200 font-mono leading-relaxed tracking-wide">
          FATALITY RATE: 99.8%. The hospital is completely overrun. Scavenge for medical supplies, blood samples, and physical evidence. Do not let them hear you.
        </div>
      </div>

      <div className="mb-10 relative z-10">
        <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-900" />
            <input 
              type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="SCAN MEDICAL TAG"
              className="w-full bg-zinc-950/80 border border-red-900/50 rounded-lg py-4 pl-12 pr-4 text-red-100 focus:outline-none focus:border-red-500 transition-colors uppercase font-mono tracking-widest text-sm shadow-inner" required
            />
          </div>
          <button type="submit" disabled={codeLoading} className="bg-red-800 hover:bg-red-700 text-white font-black py-4 sm:py-0 px-8 rounded-lg transition-colors disabled:opacity-50 tracking-widest font-mono text-sm shadow-[0_0_20px_rgba(153,27,27,0.5)]">
            {codeLoading ? 'SCANNING...' : 'EXTRACT'}
          </button>
        </form>
        {message && <p className={`mt-3 text-xs font-mono tracking-wide flex items-center gap-2 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}><FileWarning className="w-4 h-4" /> {message.text}</p>}
      </div>

      <div className="relative z-10">
        <div className="flex items-end gap-3 mb-4 border-b border-red-900/30 pb-2">
          <Search className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-black text-red-500 tracking-widest uppercase">EVIDENCE LOCKER</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {inventorySlots.map((_: any, index: number) => {
            const item = currentInventory[index];
            const hasImage = item && ITEM_IMAGES[item];
            return (
              <button key={index} onClick={() => item && setSelectedItem(item)} disabled={!item}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center transition-all duration-300 outline-none relative group ${item ? 'bg-red-950/20 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.15)] hover:border-red-400 hover:shadow-[0_0_25px_rgba(220,38,38,0.5)] cursor-pointer' : 'bg-black border-red-950/50 scale-95 cursor-default'}`}>
                {!item && <span className="absolute opacity-20 text-3xl font-black text-red-900">0{index + 1}</span>}
                {item ? (hasImage ? <img src={ITEM_IMAGES[item]} alt={item} className="w-full h-full object-contain rounded-md filter contrast-125 group-hover:scale-105 transition-transform" /> : <><Skull className="w-6 h-6 text-red-600 mb-1" /><span className="text-[9px] font-bold text-red-300 tracking-wider uppercase truncate w-full px-1">{item}</span></>) : <span className="text-[10px] text-red-950 font-mono">N/A</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}