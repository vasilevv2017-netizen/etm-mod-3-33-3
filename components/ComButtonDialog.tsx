import React, { useState } from 'react';
import { ComButton } from '../types';

interface Props {
  initialBtn: Omit<ComButton, 'id'>;
  onSave: (btn: Omit<ComButton, 'id'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const ComButtonDialog: React.FC<Props> = ({ initialBtn, onSave, onDelete, onClose }) => {
  const [name, setName] = useState(initialBtn.name);
  const [command, setCommand] = useState(initialBtn.command);
  const [mode, setMode] = useState<'text' | 'hex'>(initialBtn.mode);
  const [repeatCount, setRepeatCount] = useState(initialBtn.repeatCount);
  const [repeatPeriod, setRepeatPeriod] = useState(initialBtn.repeatPeriod);

  const handleSave = () => {
    if (!name || !command) {
      alert("Name and Command are required");
      return;
    }
    onSave({ 
      name, 
      command, 
      mode, 
      repeatCount: Math.max(1, repeatCount), 
      repeatPeriod: Math.max(0, repeatPeriod) 
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-gray-100 uppercase tracking-tighter">Command Key</h3>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[8px] font-black text-zinc-600 uppercase block mb-1.5 ml-1">Button Title</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-xs font-bold text-white focus:border-red-500/50 outline-none transition-all" placeholder="VERSION" />
          </div>

          <div>
            <label className="text-[8px] font-black text-zinc-600 uppercase block mb-1.5 ml-1">Serial Command</label>
            <input type="text" value={command} onChange={e => setCommand(e.target.value)} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-xs font-mono text-red-500 focus:border-red-500/50 outline-none transition-all" placeholder="V" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[8px] font-black text-zinc-600 uppercase block mb-1.5 ml-1">Format</label>
               <select value={mode} onChange={e => setMode(e.target.value as 'text' | 'hex')} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-[10px] text-zinc-300 outline-none">
                 <option value="text">TEXT</option>
                 <option value="hex">HEX</option>
               </select>
             </div>
             <div>
               <label className="text-[8px] font-black text-zinc-600 uppercase block mb-1.5 ml-1">Loops</label>
               <input type="number" value={repeatCount} onChange={e => setRepeatCount(parseInt(e.target.value) || 1)} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-[10px] font-mono text-white outline-none" />
             </div>
          </div>

          <div>
            <label className="text-[8px] font-black text-zinc-600 uppercase block mb-1.5 ml-1">Cycle Gap (ms)</label>
            <input type="number" value={repeatPeriod} onChange={e => setRepeatPeriod(parseInt(e.target.value) || 0)} className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-[10px] font-mono text-white outline-none" placeholder="0 = instant" />
          </div>

          <div className="flex gap-3 pt-6">
            <button onClick={handleSave} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-950/40 transition-all active:scale-95">
              Apply
            </button>
            {onDelete && (
              <button onClick={onDelete} className="px-6 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-black rounded-2xl text-[10px] uppercase tracking-widest border border-red-500/20">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComButtonDialog;
