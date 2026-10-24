import { Fingerprint, Skull, AlertTriangle, FileWarning, Search } from 'lucide-react';

export default function ScientistLabUI({
  team,
  roomCode,
  setRoomCode,
  handleCodeSubmit,
  codeLoading,
  message,
  inventorySlots,
  currentInventory,
  ITEM_IMAGES,
  setSelectedItem
}: any) {
  return (
    <div className="relative animate-in fade-in duration-1000">
      {/* Background bloody glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* Caution Tape */}
      <div className="w-full h-4 mb-6 bg-[repeating-linear-gradient(45deg,#eab308,#eab308_15px,#000_15px,#000_30px)] border-y border-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.2)]"></div>

      {/* Crime Scene Header */}
      <div className="border border-red-900/50 bg-black/60 rounded-xl p-6 shadow-2xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xs text-red-500 mb-2 tracking-[0.3em] font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> ACTIVE CRIME SCENE
            </h2>
            <p className="text-4xl font-black tracking-wider uppercase mb-1 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
              {team.current_room}
            </p>
            <p className="text-sm text-zinc-500 font-mono">CASE FILE: HOMICIDE SC-042</p>
          </div>
          <Skull className="w-12 h-12 text-red-900/40" />
        </div>
        <div className="mt-4 p-3 bg-red-950/20 border border-red-900/30 rounded text-xs text-red-300/80 font-mono leading-relaxed">
          WARNING: UNAUTHORIZED ACCESS PROHIBITED. The lead scientist has been murdered. Scan the area for forensic evidence, review biological samples, and extract the encrypted component key.
        </div>
      </div>

      {/* Evidence Scanner Form */}
      <div className="mb-10 relative z-10">
        <h3 className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase mb-2 ml-1 flex items-center gap-2">
          <ScanLine className="w-3 h-3 text-red-500" /> Evidence Log Terminal
        </h3>
        <form onSubmit={handleCodeSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input 
              type="text" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ENTER EVIDENCE TAG CODE"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-red-100 focus:outline-none focus:border-red-600 transition-colors uppercase font-mono tracking-widest text-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={codeLoading}
            className="bg-red-900 hover:bg-red-800 border border-red-700 text-white font-bold px-6 rounded-lg transition-colors disabled:opacity-50 tracking-widest font-mono text-sm shadow-[0_0_15px_rgba(153,27,27,0.4)]"
          >
            {codeLoading ? 'LOGGING...' : 'LOG ITEM'}
          </button>
        </form>
        {message && (
          <p className={`mt-3 text-xs font-mono tracking-wide flex items-center gap-2 ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            <FileWarning className="w-4 h-4" /> {message.text}
          </p>
        )}
      </div>

      {/* Forensic Inventory */}
      <div className="relative z-10">
        <div className="flex items-end gap-3 mb-4 border-b border-zinc-800 pb-2">
          <Search className="w-6 h-6 text-blue-500/70" />
          <h2 className="text-2xl font-black text-zinc-300 tracking-widest uppercase">CHAIN OF CUSTODY</h2>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {inventorySlots.map((_: any, index: number) => {
            const item = currentInventory[index];
            const hasImage = item && ITEM_IMAGES[item];

            return (
              <button 
                key={index} 
                onClick={() => item && setSelectedItem(item)}
                disabled={!item}
                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center transition-all duration-300 overflow-hidden outline-none relative group ${
                  item 
                    ? 'bg-zinc-900 border-zinc-600 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:border-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer' 
                    : 'bg-black border-zinc-800/40 scale-95 cursor-default'
                }`}
              >
                {/* Evidence Marker styling for empty slots */}
                {!item && <span className="absolute bottom-1 right-2 text-[8px] font-black text-zinc-800">{index + 1}</span>}
                
                {item ? (
                  hasImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={ITEM_IMAGES[item]} 
                      alt={item} 
                      className="w-full h-full object-contain rounded-md filter contrast-125 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-red-900/20 flex items-center justify-center mb-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,1)]" />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-300 tracking-wider uppercase truncate w-full px-1">
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
      
      {/* Bottom Caution Tape */}
      <div className="w-full h-2 mt-12 bg-[repeating-linear-gradient(-45deg,#eab308,#eab308_15px,#000_15px,#000_30px)] opacity-50"></div>
    </div>
  );
}

// Helper icon component for the input box
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScanLine(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>
    </svg>
  );
}