
import React, { useState } from 'react';

interface Props {
  initialMsg: { id: string; data: string; period: number; name?: string };
  onSave: (msg: { id: string; data: string; period: number; name: string }) => void;
  onClose: () => void;
}

const TransmitDialog: React.FC<Props> = ({ initialMsg, onSave, onClose }) => {
  const [name, setName] = useState(initialMsg.name || '');
  const [id, setId] = useState(initialMsg.id);
  const [data, setData] = useState(initialMsg.data);
  const [period, setPeriod] = useState(initialMsg.period || 100);

  const handleSave = () => {
    // Clean inputs
    const cleanedId = id.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
    const cleanedData = data.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().match(/.{1,2}/g)?.join(' ') || '';
    
    if (!cleanedId) {
      alert("ID cannot be empty");
      return;
    }

    onSave({ 
      name: name || `MSG ${cleanedId}`,
      id: cleanedId, 
      data: cleanedData, 
      period: Math.max(10, period) 
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
      <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl p-7 shadow-[0_30px_100px_rgba(0,0,0,0.8)] border-t-white/20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-3.5 h-3.5 bg-red-600 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.8)] animate-pulse"></div>
            <h3 className="text-xl font-black text-gray-100 tracking-tighter uppercase">Настройка TX</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-lg border border-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[8px] font-mono text-gray-600 uppercase mb-2 tracking-[0.2em] font-black">Имя сообщения</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/60 border border-white/5 rounded-xl p-4 font-bold text-gray-100 focus:outline-none focus:border-red-600/50 transition-all shadow-inner"
              placeholder="Например: Включить свет"
            />
          </div>

          <div>
            <label className="block text-[8px] font-mono text-gray-600 uppercase mb-2 tracking-[0.2em] font-black">CAN ID (Hex)</label>
            <input
              type="text"
              value={id}
              maxLength={8}
              onChange={(e) => setId(e.target.value.toUpperCase())}
              className="w-full bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-lg text-red-600 focus:outline-none focus:border-red-600/50 transition-all shadow-inner tracking-wider"
              placeholder="123 или 18FEF100"
            />
          </div>

          <div>
            <label className="block text-[8px] font-mono text-gray-600 uppercase mb-2 tracking-[0.2em] font-black">Данные (Hex байты)</label>
            <textarea
              rows={2}
              value={data}
              onChange={(e) => setData(e.target.value.toUpperCase())}
              className="w-full bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-md text-gray-300 focus:outline-none focus:border-red-600/50 transition-all shadow-inner resize-none tracking-widest leading-relaxed"
              placeholder="00 11 22 33..."
            />
          </div>

          <div>
            <label className="block text-[8px] font-mono text-gray-600 uppercase mb-2 tracking-[0.2em] font-black">Период (ms)</label>
            <input
              type="number"
              value={period}
              onChange={(e) => setPeriod(parseInt(e.target.value) || 0)}
              className="w-full bg-black/60 border border-white/5 rounded-xl p-4 font-mono text-lg text-gray-100 focus:outline-none focus:border-red-600/50 transition-all shadow-inner tracking-wider"
              placeholder="100"
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 py-4 bg-gradient-to-b from-red-500 to-red-700 text-white font-black rounded-xl shadow-2xl shadow-red-900/40 border-t border-white/20 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
            >
              СОХРАНИТЬ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransmitDialog;
