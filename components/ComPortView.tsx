
import React, { useState, useRef, useEffect } from 'react';
import { ComButton } from '../types';
import ComButtonDialog from './ComButtonDialog';

interface Props {
  comButtons: ComButton[];
  comLogs: string[];
  onUpdateComButtons: (btns: ComButton[]) => void;
  onComButtonPress: (btn: ComButton) => void;
  onSendCommand: (cmd: string) => void;
  onClearComLogs: () => void;
  onExportButtons: () => void;
  onImportButtons: () => void;
}

const ComPortView: React.FC<Props> = (props) => {
  const [editingBtn, setEditingBtn] = useState<{ btn: ComButton; index: number } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<any>(null);
  const hasMovedRef = useRef(false);
  const isSetupTriggered = useRef(false);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [props.comLogs.length]);

  const handleStart = (btn: ComButton, index: number) => {
    hasMovedRef.current = false;
    isSetupTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isSetupTriggered.current = true;
      setEditingBtn({ btn, index });
    }, 700);
  };

  const handleEnd = (btn: ComButton) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isSetupTriggered.current && !hasMovedRef.current) {
      props.onComButtonPress(btn);
    }
  };

  const handleSaveBtn = (updated: Omit<ComButton, 'id'>) => {
    if (editingBtn) {
      const newBtns = [...props.comButtons];
      newBtns[editingBtn.index] = { ...updated, id: editingBtn.btn.id };
      props.onUpdateComButtons(newBtns);
    } else if (isAdding) {
      props.onUpdateComButtons([...props.comButtons, { ...updated, id: Date.now().toString() }]);
    }
    setEditingBtn(null); setIsAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950/30 overflow-hidden">
      <div className="p-4 bg-zinc-900 border-b border-white/5 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-2">
            <button onClick={props.onImportButtons} className="text-[8px] font-black uppercase text-zinc-500 bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-white/5 active:bg-zinc-700">Load Set</button>
            <button onClick={props.onExportButtons} className="text-[8px] font-black uppercase text-zinc-500 bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-white/5 active:bg-zinc-700">Save Set</button>
          </div>
          <button onClick={() => setIsAdding(true)} className="text-[8px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 active:scale-95 transition-all">Add Key</button>
        </div>
        
        <div className="text-[7px] text-zinc-700 uppercase font-black mb-2 opacity-40 tracking-tighter">📁 Downloads/ETM-doc</div>

        <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1 monitor-scroll no-scrollbar touch-pan-y">
          {props.comButtons.map((btn, idx) => (
            <button
              key={btn.id}
              onTouchStart={() => handleStart(btn, idx)}
              onTouchEnd={() => handleEnd(btn)}
              onMouseDown={() => handleStart(btn, idx)}
              onMouseUp={() => handleEnd(btn)}
              onTouchMove={() => { hasMovedRef.current = true; }}
              onContextMenu={(e) => e.preventDefault()}
              className="h-10 bg-zinc-800/80 border border-white/10 rounded-lg flex flex-col items-center justify-center px-1.5 active:bg-red-600 transition-all shadow-md overflow-hidden shrink-0"
            >
              <div className="text-[9px] font-black text-zinc-100 uppercase tracking-tighter truncate w-full text-center leading-none mb-0.5">{btn.name}</div>
              <div className="text-[6px] font-mono text-zinc-500 truncate w-full text-center opacity-50 font-bold">{btn.command}</div>
            </button>
          ))}
          {props.comButtons.length === 0 && (
            <div className="col-span-3 py-8 text-center text-[9px] text-zinc-700 uppercase font-black tracking-widest opacity-30">No keys set</div>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5 bg-zinc-900/80 shrink-0 border-b border-white/5">
        <input type="text" placeholder="DIRECT CMD..." className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 font-mono text-[11px] text-red-400 outline-none shadow-inner uppercase" onKeyDown={e => { if (e.key === 'Enter') { props.onSendCommand(e.currentTarget.value); e.currentTarget.value = ''; } }} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-black/10 overflow-hidden">
        <div className="px-4 py-1.5 flex justify-between items-center bg-zinc-900/40 border-b border-white/5 shrink-0">
           <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Bus Terminal stream</span>
           <button onClick={props.onClearComLogs} className="text-[7px] font-black text-zinc-500 uppercase border border-white/10 px-2 py-0.5 rounded hover:bg-white/5">Flush</button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-[9px] monitor-scroll leading-tight">
          {props.comLogs.map((log, i) => (
            <div key={i} className={`mb-0.5 whitespace-pre-wrap ${log.includes('RX ←') ? 'text-blue-400/80' : 'text-emerald-400/80'}`}>{log}</div>
          ))}
          <div className="h-4" />
        </div>
      </div>

      {(editingBtn || isAdding) && (
        <ComButtonDialog 
          initialBtn={editingBtn?.btn || { name: '', command: '', mode: 'text', repeatCount: 1, repeatPeriod: 0 }}
          onSave={handleSaveBtn}
          onDelete={() => { if (editingBtn) props.onUpdateComButtons(props.comButtons.filter((_, i) => i !== editingBtn.index)); setEditingBtn(null); }}
          onClose={() => { setEditingBtn(null); setIsAdding(false); }}
        />
      )}
    </div>
  );
};

export default ComPortView;
