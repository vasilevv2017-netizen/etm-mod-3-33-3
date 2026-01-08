
import React, { useState, useRef, useEffect } from 'react';
import { CanMessage, CanSpeed, MonitorView, SavedTransmitMessage, ComButton, CanRule, GraphConfig } from '../types';
import TransmitDialog from './TransmitDialog';
import GraphView from './GraphView';
import LogicView from './LogicView';
import ComPortView from './ComPortView';

interface Props {
  deviceName: string; connectionStatus: string; speed: CanSpeed; onSpeedChange: (s: CanSpeed) => void;
  isCanOpen: boolean; onToggleCan: (open: boolean) => void; messages: CanMessage[]; onDisconnect: () => void;
  logs: string[]; comLogs: string[]; onClearComLogs: () => void; comButtons: ComButton[];
  onUpdateComButtons: (btns: ComButton[]) => void; onComButtonPress: (btn: ComButton) => void;
  isLoggingActive: boolean; onToggleLogging: (active: boolean) => void; isLoggingPaused: boolean;
  onToggleLogPause: () => void; onClearLogs: () => void; onImportLogs: (logs: string[]) => void;
  onSendCommand: (cmd: string) => void; savedTxMessages: SavedTransmitMessage[];
  onSaveTxMessage: (msg: SavedTransmitMessage) => void; onImportTxMessages: (messages: SavedTransmitMessage[]) => void;
  onDeleteSavedTx: (id: string) => void; activeTxIds: Set<string>; onTogglePeriodicTx: (msg: SavedTransmitMessage) => void;
  rules: CanRule[]; onUpdateRules: (rules: CanRule[]) => void;
  graphConfigs: GraphConfig[]; onUpdateGraphConfigs: (cfgs: GraphConfig[]) => void;
}

const CanMonitor: React.FC<Props> = (props) => {
  const [activeView, setActiveView] = useState<MonitorView>(MonitorView.Live);
  const [isTxDialogOpen, setIsTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<SavedTransmitMessage | null>(null);
  const [playbackInterval, setPlaybackInterval] = useState(50);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeView === MonitorView.Logs && !props.isLoggingPaused) {
      logEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [props.logs.length, activeView, props.isLoggingPaused]);

  const exportData = (data: any, filename: string, isText = false) => {
    const content = isText ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: isText ? 'text/plain' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ETM-doc/${filename}${isText ? '' : '.json'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = (callback: (data: any) => void, accept = '.json') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const result = ev.target?.result as string;
          if (accept === '.json') callback(JSON.parse(result));
          else callback(result);
        } catch (err) {
          alert("Ошибка формата файла.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const sendLinesToBus = async (lines: string[]) => {
    for (const line of lines) {
      const match = line.match(/([0-9A-Fa-f]+)\s*\[\d+\]\s*([0-9A-Fa-f\s]+)/);
      if (match) {
        const id = match[1];
        const data = match[2].replace(/\s/g, '');
        const dlc = (data.length / 2).toString(16).toUpperCase();
        const cmd = `${id.length <= 3 ? 't' : 'T'}${id.padStart(id.length <= 3 ? 3 : 8, '0')}${dlc}${data}`;
        props.onSendCommand(cmd);
        await new Promise(r => setTimeout(r, playbackInterval));
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-zinc-900 safe-pt safe-pb overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-zinc-800/80 border-b border-white/5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${props.connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase truncate max-w-[120px]">{props.deviceName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black text-zinc-600 tracking-widest">{props.speed}K CAN</span>
          <button onClick={props.onDisconnect} className="text-zinc-500">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zinc-800 p-1.5 gap-1 overflow-x-auto shrink-0 border-b border-white/5 no-scrollbar">
        {(Object.values(MonitorView)).map(v => (
          <button key={v} onClick={() => setActiveView(v)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap ${activeView === v ? 'bg-red-500 text-white' : 'text-zinc-500'}`}>{v}</button>
        ))}
      </div>

      <div className="flex-1 relative bg-zinc-950/20 overflow-hidden">
        {activeView === MonitorView.Live && (
          <div className="absolute inset-0 flex flex-col p-4 gap-4 min-h-0">
             <div className="grid grid-cols-3 gap-2">
               {(['125', '250', '500'] as CanSpeed[]).map(s => (
                 <button key={s} onClick={() => props.onSpeedChange(s)} disabled={props.isCanOpen} className={`py-3 rounded-2xl font-black text-[10px] uppercase border ${props.speed === s ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}>{s}K</button>
               ))}
             </div>
             <button onClick={() => props.onToggleCan(!props.isCanOpen)} className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${props.isCanOpen ? 'bg-zinc-800 text-red-400 border border-red-900/30' : 'bg-emerald-500 text-white'}`}>
               {props.isCanOpen ? 'ОСТАНОВИТЬ CAN' : 'ЗАПУСТИТЬ CAN'}
             </button>
             <div className="flex-1 min-h-0 bg-zinc-800/30 rounded-3xl border border-white/5 overflow-y-auto monitor-scroll">
                <div className="sticky top-0 bg-zinc-800/90 backdrop-blur grid grid-cols-4 p-3 text-[8px] font-black text-zinc-500 uppercase border-b border-white/5 z-10">
                   <div>CAN ID</div><div className="col-span-2">DATA (HEX)</div><div className="text-right">QTY</div>
                </div>
                {props.messages.sort((a,b) => a.id.localeCompare(b.id)).map(m => (
                  <div key={m.id} className="grid grid-cols-4 p-4 border-b border-white/5 items-center">
                    <div className="text-red-400 font-bold text-sm tabular-nums">{m.id}</div>
                    <div className="col-span-2 text-zinc-300 font-mono text-[11px] truncate">{m.data}</div>
                    <div className="text-right text-emerald-500 font-bold text-xs">{m.count}</div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeView === MonitorView.TX && (
          <div className="absolute inset-0 flex flex-col p-4 overflow-y-auto monitor-scroll min-h-0">
            <div className="flex justify-between items-center mb-4 gap-2">
              <div className="flex gap-2">
                <button onClick={() => triggerImport(props.onImportTxMessages)} className="bg-zinc-800 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase text-zinc-400 border border-white/5">Load</button>
                <button onClick={() => exportData(props.savedTxMessages, 'etm_tx')} className="bg-zinc-800 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase text-zinc-400 border border-white/5">Save</button>
              </div>
              <button onClick={() => { setEditingTx(null); setIsTxDialogOpen(true); }} className="bg-red-500 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase text-white">New TX</button>
            </div>
            <div className="space-y-3 pb-20">
              {props.savedTxMessages.map(msg => (
                <div key={msg.id_key} className="bg-zinc-800/60 p-4 rounded-3xl border border-white/5 flex items-center justify-between" onClick={() => { setEditingTx(msg); setIsTxDialogOpen(true); }}>
                  <div className="flex-1 mr-4 overflow-hidden">
                    <div className="text-[11px] font-black uppercase text-zinc-200 truncate">{msg.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-1"><span className="text-red-400">{msg.id}</span> {msg.data}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); props.onTogglePeriodicTx(msg); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${props.activeTxIds.has(msg.id_key) ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-700 text-zinc-300'}`}>{props.activeTxIds.has(msg.id_key) ? 'STOP' : 'SEND'}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === MonitorView.Logs && (
          <div className="absolute inset-0 flex flex-col bg-zinc-950 min-h-0">
            <div className="p-3 bg-zinc-800 border-b border-white/5 flex gap-2 shrink-0">
               <button onClick={() => props.onToggleLogging(!props.isLoggingActive)} className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg ${props.isLoggingActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{props.isLoggingActive ? 'LOG OFF' : 'LOG ON'}</button>
               <button onClick={props.onToggleLogPause} className="px-4 bg-zinc-700 py-2 text-[8px] font-black uppercase rounded-lg text-zinc-300">{props.isLoggingPaused ? 'RESUME' : 'PAUSE'}</button>
               <button onClick={() => sendLinesToBus(props.logs)} className="px-4 bg-red-600 py-2 text-[8px] font-black uppercase rounded-lg text-white">SEND ALL</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] monitor-scroll bg-black/40">
              {props.logs.map((l, i) => <div key={i} className="mb-0.5 text-emerald-500/80 leading-tight select-text tracking-tighter">{l}</div>)}
              <div ref={logEndRef} className="h-4" />
            </div>
          </div>
        )}

        {activeView === MonitorView.ComPort && (
          <ComPortView 
            comButtons={props.comButtons} 
            comLogs={props.comLogs} 
            onUpdateComButtons={props.onUpdateComButtons} 
            onComButtonPress={props.onComButtonPress} 
            onSendCommand={props.onSendCommand} 
            onClearComLogs={props.onClearComLogs} 
            onExportButtons={() => exportData(props.comButtons, 'com_buttons')} 
            onImportButtons={() => triggerImport(props.onUpdateComButtons)} 
          />
        )}
        {activeView === MonitorView.Logic && (
          <LogicView 
            rules={props.rules} 
            onUpdateRules={props.onUpdateRules} 
            onExportRules={() => exportData(props.rules, 'etm_logic')} 
            onImportRules={() => triggerImport(props.onUpdateRules)} 
          />
        )}
        {activeView === MonitorView.Graph && (
          <GraphView 
            messages={props.messages} 
            configs={props.graphConfigs} 
            onUpdateConfigs={props.onUpdateGraphConfigs} 
            onExportConfigs={() => exportData(props.graphConfigs, 'graph_configs')}
            onImportConfigs={() => triggerImport(props.onUpdateGraphConfigs)}
          />
        )}
      </div>

      {isTxDialogOpen && <TransmitDialog initialMsg={editingTx || { id: '', data: '', period: 100, name: '', id_key: '' }} onSave={(msg) => { props.onSaveTxMessage(msg as SavedTransmitMessage); setIsTxDialogOpen(false); }} onClose={() => setIsTxDialogOpen(false)} />}
    </div>
  );
};

export default CanMonitor;
