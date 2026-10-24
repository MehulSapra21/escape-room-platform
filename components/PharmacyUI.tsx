import { Fingerprint, Pill, AlertOctagon, FileWarning, Search } from 'lucide-react';

export default function PharmacyUI({ team, roomCode, setRoomCode, handleCodeSubmit, codeLoading, message, inventorySlots, currentInventory, ITEM_IMAGES, setSelectedItem }: any) {
  return (
    <div className="relative animate-in slide-in-from-right-10 fade-in duration-500">
      <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-green-900/15 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="border border-green-800/40 bg-zinc-950 rounded-xl p-6 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xs text-green-500 mb-2 tracking-[0.3em] font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" /> CHEMICAL STORAGE COMPROMISED
            </h2>
            <p className="text-4xl font-black tracking-widest uppercase mb-1 text-zinc-100 drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">
              {team.current_room}
            </p>
          </div>
          <Pill className="w-12 h-12 text-green-900/50" />
        </div>
        <div className="mt-4 p-3 bg-green-950/20 border border-green-900/30 rounded text-xs text-green-300/80 font-mono leading-relaxed">
          WARNING: AIRBORNE TOXINS DETECTED. Filter masks required. Locate the chemical solvent and bypass the dispensary locks to secure the component.
        </div>
      </div>

      <div className="mb-10 relative z-10">
        <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-700" />
            <input 
              type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())} placeholder="INPUT DISPENSARY CODE"
              className="w-full bg-black border border-green-900/50 rounded-lg py-4 pl-12 pr-4 text-green-100 focus:outline-none focus:border-green-500 transition-colors uppercase font-mono tracking-widest text-sm shadow-[inset_0_0_10px_rgba(0,0,0,1)]" required
            />
          </div>
          <button type="submit" disabled={codeLoading} className="bg-green-800 hover:bg-green-700 text-white font-bold py-4 sm:py-0 px-8 rounded-lg transition-colors disabled:opacity-50 tracking-widest font-mono text-sm shadow-[0_0_15px_rgba(21,128,61,0.4)]">
            {codeLoading ? 'VERIFYING...' : 'DISPENSE'}
          </button>
        </form>
        {message && <p className={`mt-3 text-xs font-mono tracking-wide flex items-center gap-2 ${message.type === 'error' ? 'text-red-500' : 'text-green-400'}`}><FileWarning className="w-4 h-4" /> {message.text}</p>}
      </div>

      <div className="relative z-10">
        <div className="flex items-end gap-3 mb-4 border-b border-green-900/30 pb-2">
          <Search className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-black text-green-500 tracking-widest uppercase">SECURE INVENTORY</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {inventorySlots.map((_: any, index: number) => {
            const item = currentInventory[index];
            const hasImage = item && ITEM_IMAGES[item];
            return (
              <button key={index} onClick={() => item && setSelectedItem(item)} disabled={!item}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center transition-all duration-300 outline-none group ${item ? 'bg-green-950/10 border-green-700 shadow-[0_0_15px_rgba(34,197,94,0.1)] hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] cursor-pointer' : 'bg-black border-zinc-900 scale-95 cursor-default'}`}>
                {item ? (hasImage ? <img src={ITEM_IMAGES[item]} alt={item} className="w-full h-full object-contain rounded-md filter contrast-125 group-hover:scale-105 transition-transform" /> : <><span className="text-[9px] font-bold text-green-400 tracking-wider uppercase truncate w-full px-1">{item}</span></>) : <span className="text-[10px] text-zinc-800 font-mono">EMPTY</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}