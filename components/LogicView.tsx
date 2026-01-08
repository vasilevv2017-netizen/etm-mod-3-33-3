import React, { useState } from 'react';
import { CanRule } from '../types';

interface Props {
  rules: CanRule[];
  onUpdateRules: (rules: CanRule[]) => void;
  onExportRules: () => void;
  onImportRules: () => void;
}

const LogicView: React.FC<Props> = ({ rules, onUpdateRules, onExportRules, onImportRules }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<CanRule>({ id: '', name: '', enabled: true, triggerId: '', triggerData: '', actionId: '', actionData: '' });

  const saveRule = () => {
    if (!newRule.triggerId || !newRule.actionId) return;
    onUpdateRules([...rules, { ...newRule, id: Date.now().toString() }]);
    setIsAdding(false);
  };

  const toggleRule = (id: string) => {
    onUpdateRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto monitor-scroll bg-zinc-950/20">
      <div className="flex justify-between items-center mb-4">
         <div className="flex gap-2">
            <button onClick={onImportRules} className="bg-zinc-800 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase text-zinc-400 border border-white/5 shadow-sm flex items-center gap-2">
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg> Load
            </button>
            <button onClick={onExportRules} className="bg-zinc-800 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase text-zinc-400 border border-white/5 shadow-sm flex items-center gap-2">
               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h-2v5.586l-1.293-1.293z"/></svg> Save
            </button>
         </div>
         <button onClick={() => setIsAdding(true)} className="bg-emerald-500 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase text-white shadow-lg">New Rule</button>
      </div>

      <div className="text-[7px] text-zinc-700 uppercase font-black mb-4 opacity-50 tracking-tighter ml-1">📁 Хранилище: Downloads/ETM-doc</div>

      <div className="space-y-4 pb-24">
        {rules.map(rule => (
          <div key={rule.id} className={`bg-zinc-800/50 p-5 rounded-[2rem] border transition-all ${rule.enabled ? 'border-emerald-500/20' : 'border-white/5 opacity-50 shadow-inner'}`}>
             <div className="flex justify-between items-center mb-4">
                <div className="text-[12px] font-black uppercase text-zinc-100 tracking-tight truncate mr-2">{rule.name || 'Unnamed Rule'}</div>
                <div className="flex gap-2 items-center shrink-0">
                  <button onClick={() => toggleRule(rule.id)} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${rule.enabled ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}>
                    {rule.enabled ? 'STOP' : 'START'}
                  </button>
                  <button onClick={() => onUpdateRules(rules.filter(r => r.id !== rule.id))} className="text-zinc-600 hover:text-red-500 p-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 bg-black/30 p-4 rounded-2xl border border-white/5">
                <div className="space-y-1">
                   <div className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">IF RECEIVED ID</div>
                   <div className="font-mono text-[11px] text-red-400 font-bold">{rule.triggerId}</div>
                   {rule.triggerData && <div className="text-[9px] font-mono text-zinc-500 truncate">{rule.triggerData}</div>}
                </div>
                <div className="space-y-1 border-l border-white/5 pl-4">
                   <div className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">THEN SEND</div>
                   <div className="font-mono text-[11px] text-zinc-100 font-bold">{rule.actionId}</div>
                   <div className="text-[9px] font-mono text-zinc-400 truncate">{rule.actionData}</div>
                </div>
             </div>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="py-20 text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em] opacity-30">No active rules</div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
           <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <h4 className="text-lg font-black uppercase mb-6 text-zinc-100">Auto Rule Config</h4>
              <div className="space-y-5">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-zinc-600 uppercase ml-1">Rule Name</label>
                   <input type="text" placeholder="e.g. Immobilizer bypass" className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-bold outline-none focus:border-red-500/50" onChange={e => setNewRule({...newRule, name: e.target.value})} />
                 </div>
                 
                 <div className="p-4 bg-red-500/5 rounded-3xl space-y-3 border border-red-500/10 shadow-inner">
                   <div className="text-[8px] font-black text-red-500 uppercase tracking-widest">Trigger Condition</div>
                   <div className="flex gap-2">
                     <input type="text" placeholder="ID (Hex)" className="w-1/3 bg-transparent border-b border-white/10 p-2 text-sm outline-none font-mono text-zinc-100" onChange={e => setNewRule({...newRule, triggerId: e.target.value.toUpperCase()})} />
                     <input type="text" placeholder="Data bits (optional)" className="flex-1 bg-transparent border-b border-white/10 p-2 text-sm outline-none font-mono text-zinc-400" onChange={e => setNewRule({...newRule, triggerData: e.target.value.toUpperCase()})} />
                   </div>
                 </div>

                 <div className="p-4 bg-emerald-500/5 rounded-3xl space-y-3 border border-emerald-500/10 shadow-inner">
                   <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Response Action</div>
                   <div className="flex gap-2">
                     <input type="text" placeholder="ID" className="w-1/3 bg-transparent border-b border-white/10 p-2 text-sm outline-none font-mono text-zinc-100" onChange={e => setNewRule({...newRule, actionId: e.target.value.toUpperCase()})} />
                     <input type="text" placeholder="Payload" className="flex-1 bg-transparent border-b border-white/10 p-2 text-sm outline-none font-mono text-zinc-400" onChange={e => setNewRule({...newRule, actionData: e.target.value.toUpperCase()})} />
                   </div>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button onClick={saveRule} className="flex-1 py-4 bg-emerald-500 rounded-2xl font-black text-[10px] uppercase text-white shadow-xl shadow-emerald-900/40">Save</button>
                    <button onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-zinc-800 rounded-2xl font-black text-[10px] uppercase text-zinc-500 transition-all">Cancel</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LogicView;