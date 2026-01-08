
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CanMessage, GraphConfig } from '../types';

interface Props {
  messages: CanMessage[];
  configs: GraphConfig[];
  onUpdateConfigs: (cfgs: GraphConfig[]) => void;
  onExportConfigs: () => void;
  onImportConfigs: () => void;
}

const Chart: React.FC<{ config: GraphConfig; messages: CanMessage[]; onDelete: () => void; onEdit: () => void }> = ({ config, messages, onDelete, onEdit }) => {
  const [history, setHistory] = useState<number[]>([]);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number }>({ min: config.minVal, max: config.maxVal });

  useEffect(() => {
    const target = messages.find(m => m.id === config.canId);
    if (target) {
      try {
        const hex = target.data.replace(/\s/g, '');
        const bigIntVal = BigInt('0x' + hex);
        const shift = BigInt((hex.length * 4) - config.bitOffset - config.bitLength);
        const mask = (BigInt(1) << BigInt(config.bitLength)) - BigInt(1);
        const val = Number((bigIntVal >> shift) & mask);
        setHistory(prev => [...prev.slice(-99), val]); 
      } catch(e) {}
    }
  }, [messages, config]);

  useEffect(() => {
    setZoomRange({ min: config.minVal, max: config.maxVal });
  }, [config.minVal, config.maxVal]);

  const handleZoomIn = () => {
    setZoomRange(prev => {
      const mid = (prev.max + prev.min) / 2;
      const span = (prev.max - prev.min) * 0.7;
      return { min: mid - span / 2, max: mid + span / 2 };
    });
  };

  const handleZoomOut = () => {
    setZoomRange(prev => {
      const mid = (prev.max + prev.min) / 2;
      const span = (prev.max - prev.min) * 1.3;
      return { min: mid - span / 2, max: mid + span / 2 };
    });
  };

  const handleAutoZoom = useCallback(() => {
    if (history.length === 0) return;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const padding = (max - min) * 0.1 || 1;
    setZoomRange({ min: min - padding, max: max + padding });
  }, [history]);

  const points = useMemo(() => {
    if (history.length < 2) return "";
    const range = zoomRange.max - zoomRange.min || 1;
    return history.map((val, i) => {
      const x = (i / 99) * 300;
      const y = 100 - ((val - zoomRange.min) / range) * 100;
      return `${x},${y}`;
    }).join(" ");
  }, [history, zoomRange]);

  const lastValue = history.length > 0 ? history[history.length - 1] : 0;

  return (
    <div className="bg-zinc-900/60 rounded-[1rem] border border-white/5 relative mb-3 shadow-xl overflow-hidden flex flex-col h-44 shrink-0">
      {/* Overlay Info */}
      <div className="absolute top-2 right-3 text-right z-10 pointer-events-none">
        <div className="text-[7px] font-black text-zinc-500 uppercase tracking-tight opacity-40 leading-none mb-0.5">{config.label || config.canId}</div>
        <div className="text-2xl font-black text-red-500 tabular-nums tracking-tighter leading-none">{lastValue}</div>
      </div>

      {/* Side Controls */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-20">
        <button onClick={handleZoomIn} className="w-7 h-7 bg-zinc-800/90 border border-white/10 rounded-md flex items-center justify-center text-zinc-300 active:bg-zinc-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
        </button>
        <button onClick={handleZoomOut} className="w-7 h-7 bg-zinc-800/90 border border-white/10 rounded-md flex items-center justify-center text-zinc-300 active:bg-zinc-700">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
        </button>
        <button onClick={handleAutoZoom} className="w-7 h-7 bg-zinc-800/90 border border-emerald-500/20 rounded-md flex items-center justify-center text-emerald-500 font-black text-[9px]">A</button>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-1.5 left-2 flex gap-1 z-20 opacity-30 hover:opacity-100">
         <button onClick={onEdit} className="p-1 text-zinc-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
         <button onClick={onDelete} className="p-1 text-zinc-500"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-black/10 overflow-hidden">
        <div className="absolute right-1 top-1 text-[6px] font-mono text-zinc-800 pointer-events-none">{Math.round(zoomRange.max)}</div>
        <div className="absolute right-1 bottom-1 text-[6px] font-mono text-zinc-800 pointer-events-none">{Math.round(zoomRange.min)}</div>
        
        <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
          <line x1="294" y1="0" x2="300" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <line x1="294" y1="50" x2="300" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <line x1="294" y1="100" x2="300" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
          <polyline fill="none" stroke="#ef4444" strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" points={points} className="transition-all duration-300" />
        </svg>
      </div>
    </div>
  );
};

const GraphView: React.FC<Props> = ({ messages, configs, onUpdateConfigs, onExportConfigs, onImportConfigs }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GraphConfig>({ id: '', canId: '', bitOffset: 0, bitLength: 8, minVal: 0, maxVal: 100, label: '' });

  const openForm = (cfg?: GraphConfig) => {
    if (cfg) { setForm(cfg); setEditingId(cfg.id); }
    else { setForm({ id: '', canId: '', bitOffset: 0, bitLength: 8, minVal: 0, maxVal: 100, label: '' }); setEditingId('new'); }
  };

  const save = () => {
    if (editingId === 'new') onUpdateConfigs([...configs, { ...form, id: Date.now().toString() }]);
    else onUpdateConfigs(configs.map(c => c.id === editingId ? { ...form } : c));
    setEditingId(null);
  };

  return (
    <div className="absolute inset-0 flex flex-col min-h-0 bg-zinc-950/40 p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
         <div className="flex gap-2">
            <button onClick={onImportConfigs} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-zinc-500 border border-white/5 active:bg-zinc-700">Load Set</button>
            <button onClick={onExportConfigs} className="bg-zinc-800 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase text-zinc-500 border border-white/5 active:bg-zinc-700">Save Set</button>
         </div>
         <button onClick={() => openForm()} className="bg-emerald-500 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase text-white shadow-lg active:scale-95 transition-all">Add Trace</button>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden touch-pan-y monitor-scroll pb-24">
        {configs.map(c => (
          <Chart key={c.id} config={c} messages={messages} onEdit={() => openForm(c)} onDelete={() => onUpdateConfigs(configs.filter(x => x.id !== c.id))} />
        ))}
        {configs.length === 0 && (
          <div className="py-24 text-center text-zinc-800 text-[10px] font-black uppercase tracking-[0.4em] opacity-30">No active traces</div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
           <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-[2rem] border border-white/10 shadow-2xl">
              <h4 className="text-xs font-black uppercase mb-6 text-zinc-100 tracking-widest">{editingId === 'new' ? 'New Trace' : 'Trace Settings'}</h4>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[7px] font-black text-zinc-600 uppercase block">Label</label>
                    <input type="text" value={form.label} className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-[11px] font-bold outline-none text-zinc-100" onChange={e => setForm({...form, label: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-zinc-600 uppercase block">CAN ID (HEX)</label>
                      <input type="text" value={form.canId} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[11px] font-mono text-red-500 outline-none" onChange={e => setForm({...form, canId: e.target.value.toUpperCase()})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-zinc-600 uppercase block">Length (bits)</label>
                      <input type="number" value={form.bitLength} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[11px] outline-none text-zinc-100" onChange={e => setForm({...form, bitLength: parseInt(e.target.value) || 1})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-zinc-600 uppercase block">Offset</label>
                      <input type="number" value={form.bitOffset} className="w-full bg-black border border-white/5 rounded-xl p-3 text-[11px] outline-none text-zinc-100" onChange={e => setForm({...form, bitOffset: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[7px] font-black text-zinc-600 uppercase block">Range</label>
                      <div className="flex gap-1.5">
                        <input type="number" value={form.minVal} className="w-full bg-black border border-white/5 rounded-lg p-2 text-[9px] text-zinc-500" onChange={e => setForm({...form, minVal: parseInt(e.target.value) || 0})} />
                        <input type="number" value={form.maxVal} className="w-full bg-black border border-white/5 rounded-lg p-2 text-[9px] text-zinc-500" onChange={e => setForm({...form, maxVal: parseInt(e.target.value) || 100})} />
                      </div>
                    </div>
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button onClick={save} className="flex-1 py-3 bg-emerald-500 rounded-xl font-black text-[9px] uppercase text-white active:scale-95 transition-all">Apply</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 py-3 bg-zinc-800 rounded-xl font-black text-[9px] uppercase text-zinc-500">Cancel</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GraphView;
