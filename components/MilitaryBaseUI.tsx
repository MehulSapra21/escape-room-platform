import { Fingerprint, ShieldAlert, Crosshair, FileWarning, Search } from 'lucide-react';

export default function MilitaryBaseUI({ team, roomCode, setRoomCode, handleCodeSubmit, codeLoading, message, inventorySlots, currentInventory, ITEM_IMAGES, setSelectedItem }: any) {
  return (
    <div className="relative animate-in slide-in-from-left-10 fade-in duration-500">
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-600/10 blur-[100px] rounded-full pointer-events-none animate-pulse"></div>
      
      <div className="border-2 border-amber-600/30 bg-zinc-900 rounded-lg p-6 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.2)_10px,rgba(0,0,0,0.2)_20px)] pointer-events-none"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h2 className="text-xs text-amber-500 mb-2 tracking-[0.3em] font-black flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 animate-bounce" /> BASE LOCKDOWN INITIATED
            </h2>
            <p className="text-4xl font-black tracking-widest uppercase mb-1 text-white">
              {team.current_room}
            </p>
          </div>
          <Crosshair className="w-12 h-12 text-amber-600/20" />
        </div>
        <div className="mt-4 p-3 bg-black/50 border border-amber-900/50 rounded text-xs text-amber-400/80 font-mono leading-relaxed relative z-10">
          DEFENSE SYSTEMS ACTIVE. Military personnel have been evacuated or compromised. Override the armory panels to retrieve the encoded component.
        </div>
      </div>

      <div className="mb-10 relative z-10">
        <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-700" />
            <input 
              type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="ENTER OVERRIDE KEY"
              className="w-full bg-black border border-amber-900 rounded-lg py-4 pl-12 pr-4 text-amber-100 focus:outline-none focus:border-amber-500 transition-colors uppercase font-mono tracking-widest text-sm shadow-inner" required
            />
          </div>
          <button type="submit" disabled={codeLoading} className="bg-amber-600 hover:bg-amber-500 text-black font-black py-4 sm:py-0 px-8 rounded-lg transition-colors disabled:opacity-50 tracking-widest font-mono text-sm shadow-[0_0_15px_rgba(217,119,6,0.4)]">
            {codeLoading ? 'PROCESSING...' : 'OVERRIDE'}
          </button>
        </form>
        {message && <p className={`mt-3 text-xs font-mono tracking-wide flex items-center gap-2 ${message.type === 'error' ? 'text-red-500' : 'text-amber-400'}`}><FileWarning className="w-4 h-4" /> {message.text}</p>}
      </div>

      <div className="relative z-10">
        <div className="flex items-end gap-3 mb-4 border-b border-amber-900/30 pb-2">
          <Search className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-black text-amber-500 tracking-widest uppercase">TACTICAL GEAR</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {inventorySlots.map((_: any, index: number) => {
            const item = currentInventory[index];
            const hasImage = item && ITEM_IMAGES[item];
            return (
              <button key={index} onClick={() => item && setSelectedItem(item)} disabled={!item}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center transition-all duration-300 outline-none group ${item ? 'bg-amber-950/20 border-amber-700 shadow-[0_0_15px_rgba(217,119,6,0.1)] hover:border-amber-400 hover:shadow-[0_0_20px_rgba(217,119,6,0.4)] cursor-pointer' : 'bg-black border-zinc-900 scale-95 cursor-default'}`}>
                {item ? (hasImage ? <img src={ITEM_IMAGES[item]} alt={item} className="w-full h-full object-contain rounded-md filter contrast-125 group-hover:scale-105 transition-transform" /> : <><span className="text-[9px] font-bold text-amber-400 tracking-wider uppercase truncate w-full px-1">{item}</span></>) : <span className="text-[10px] text-zinc-800 font-mono">EMPTY</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}