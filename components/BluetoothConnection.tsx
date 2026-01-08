import React, { useState, useEffect } from 'react';

interface Props {
  onConnect: (device: any) => void;
}

const BluetoothConnection: React.FC<Props> = ({ onConnect }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBtSupported, setIsBtSupported] = useState(true);
  const [isWebView, setIsWebView] = useState(false);

  useEffect(() => {
    const isUAWebView = /wv|Version\/[\d.]+\s+Chrome\/[\d.]+\s+Mobile/i.test(navigator.userAgent);
    setIsWebView(isUAWebView);

    if (!(navigator as any).bluetooth) {
      setIsBtSupported(false);
      setError("Web Bluetooth не поддерживается в этом окружении.");
    }
  }, []);

  const startScan = async () => {
    if (!(navigator as any).bluetooth) {
      setError("Bluetooth недоступен. Android APK (WebView) блокирует Bluetooth. Используйте Chrome.");
      return;
    }
    
    setIsScanning(true);
    setError(null);
    try {
      const optionalServices = [
        '00001101-0000-1000-8000-00805f9b34fb',
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '0000dfb0-0000-1000-8000-00805f9b34fb'
      ];

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: optionalServices
      });
      
      if (device) {
        onConnect(device);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Bluetooth Error');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-900 overflow-hidden">
      <div className="mt-12 flex-1 bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden mb-6 shadow-2xl flex flex-col items-center justify-center p-8 text-center">
        {isScanning ? (
          <div className="space-y-6">
            <div className="relative inline-block">
               <div className="w-20 h-20 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400 font-mono text-xs uppercase tracking-widest animate-pulse">Сканирование...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto border border-white/5 shadow-inner">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.192 9.192 0 0112.142 0M2.828 9.9a13.435 13.435 0 0118.344 0" />
              </svg>
            </div>
            
            {(!isBtSupported || isWebView) && (
              <div className="space-y-4 bg-red-950/30 p-4 rounded-xl border border-red-500/20">
                <p className="text-red-500 text-xs font-black uppercase tracking-tighter">ВНИМАНИЕ: APK ОГРАНИЧЕНИЕ</p>
                <p className="text-gray-400 text-[10px] leading-relaxed uppercase font-bold">
                  Android блокирует Bluetooth внутри установленных APK приложений.
                </p>
                <p className="text-white text-[11px] font-black underline decoration-red-600">
                  ОТКРОЙТЕ САЙТ В CHROME ДЛЯ РАБОТЫ
                </p>
              </div>
            )}

            {!isScanning && isBtSupported && !isWebView && (
              <>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Адаптер не выбран</p>
                <p className="text-gray-500 text-[10px] px-4 leading-relaxed uppercase">Для работы на Android необходимо разрешить Bluetooth и Местоположение.</p>
              </>
            )}

            {error && <p className="text-red-500 text-[10px] font-mono bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
          </div>
        )}
      </div>

      <button
        onClick={startScan}
        disabled={isScanning}
        className="w-full py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 active:scale-[0.98] uppercase tracking-widest text-sm border-t border-white/20 mb-4"
      >
        {isScanning ? 'ПОИСК...' : 'НАЧАТЬ ПОИСК'}
      </button>
      
      <p className="text-[9px] text-gray-600 text-center font-black uppercase">ETM Module v3.33 {isWebView ? '- APK MODE' : ''}</p>
    </div>
  );
};

export default BluetoothConnection;