import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppStep, CanMessage, CanSpeed, SavedTransmitMessage, CanRule, ComButton, GraphConfig } from './types';
import SplashScreen from './components/SplashScreen';
import BluetoothConnection from './components/BluetoothConnection';
import CanMonitor from './components/CanMonitor';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Splash);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [canSpeed, setCanSpeed] = useState<CanSpeed>('250');
  const [isCanOpen, setIsCanOpen] = useState(false);

  const STORAGE_KEY = 'ETM_APP_DATA_V1';

  const messagesRef = useRef<Map<string, CanMessage>>(new Map());
  const logsRef = useRef<string[]>([]);
  
  const [displayMessages, setDisplayMessages] = useState<CanMessage[]>([]);
  const [displayLogs, setDisplayLogs] = useState<string[]>([]);
  const [comLogs, setComLogs] = useState<string[]>([]);
  
  const [comButtons, setComButtons] = useState<ComButton[]>([]);
  const [savedTxMessages, setSavedTxMessages] = useState<SavedTransmitMessage[]>([]);
  const [rules, setRules] = useState<CanRule[]>([]);
  const [graphConfigs, setGraphConfigs] = useState<GraphConfig[]>([]);

  const [isLoggingActive, setIsLoggingActive] = useState(false);
  const [isLoggingPaused, setIsLoggingPaused] = useState(false);
  const [activeTxIds, setActiveTxIds] = useState<Set<string>>(new Set());

  const rulesRef = useRef<CanRule[]>([]);
  const isLoggingPausedRef = useRef(false);
  const isLoggingActiveRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.comButtons) setComButtons(parsed.comButtons);
      if (parsed.savedTxMessages) setSavedTxMessages(parsed.savedTxMessages);
      if (parsed.rules) { setRules(parsed.rules); rulesRef.current = parsed.rules; }
      if (parsed.graphConfigs) setGraphConfigs(parsed.graphConfigs);
    } else {
      setComButtons([
        { id: '1', name: 'VER', command: 'V', mode: 'text', repeatCount: 1, repeatPeriod: 0 },
        { id: '2', name: 'STAT', command: 'F', mode: 'text', repeatCount: 1, repeatPeriod: 0 },
        { id: '3', name: 'OPEN', command: 'O', mode: 'text', repeatCount: 1, repeatPeriod: 0 },
        { id: '4', name: 'CLS', command: 'C', mode: 'text', repeatCount: 1, repeatPeriod: 0 }
      ]);
    }
  }, []);

  useEffect(() => {
    const data = { comButtons, savedTxMessages, rules, graphConfigs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    rulesRef.current = rules;
  }, [comButtons, savedTxMessages, rules, graphConfigs]);

  useEffect(() => {
    isLoggingPausedRef.current = isLoggingPaused;
    isLoggingActiveRef.current = isLoggingActive;
  }, [isLoggingPaused, isLoggingActive]);

  const gattServerRef = useRef<any | null>(null);
  const rxCharRef = useRef<any | null>(null);
  const txCharRef = useRef<any | null>(null);
  const dataBufferRef = useRef<string>("");
  const txIntervalsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const timer = setInterval(() => {
      if (step === AppStep.Monitor) {
        setDisplayMessages(Array.from(messagesRef.current.values()));
        setDisplayLogs([...logsRef.current]);
      }
    }, 250); 
    return () => clearInterval(timer);
  }, [step]);

  const addComLog = (msg: string, isIncoming: boolean) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour12: false });
    const entry = `[${time}] ${isIncoming ? 'RX ←' : 'TX →'} ${msg}`;
    setComLogs(prev => [...prev.slice(-99), entry]);
  };

  const sendLawicell = useCallback(async (cmd: string) => {
    if (!txCharRef.current) return;
    try {
      const data = new TextEncoder().encode(cmd + '\r');
      await txCharRef.current.writeValue(data);
      addComLog(cmd, false);
    } catch (err) {
      addComLog("ERR: " + cmd, false);
    }
  }, []);

  const parseLawicellFrame = (frame: string) => {
    if (!frame) return;
    const type = frame[0];
    const isLawicellFrame = type === 't' || type === 'T' || type === 'r' || type === 'R';
    
    if (!isLawicellFrame) {
      addComLog(frame, true);
      return;
    }

    try {
      const isStandard = type === 't' || type === 'r';
      const idLen = isStandard ? 3 : 8;
      const id = frame.substring(1, 1 + idLen);
      const dlcChar = frame.substring(1 + idLen, 2 + idLen);
      const dlc = parseInt(dlcChar, 16);
      if (isNaN(dlc)) return;
      const rawData = frame.substring(2 + idLen, 2 + idLen + (dlc * 2));
      const dataFormatted = (rawData.match(/.{1,2}/g) || []).join(' ');

      if (isLoggingActiveRef.current && !isLoggingPausedRef.current) {
        logsRef.current.push(`${id} [${dlc}] ${dataFormatted}`);
        if (logsRef.current.length > 2000) logsRef.current.shift();
      }

      rulesRef.current.forEach(rule => {
        if (rule.enabled && id === rule.triggerId) {
          if (!rule.triggerData || dataFormatted.includes(rule.triggerData)) {
            const rawActionData = rule.actionData.replace(/\s/g, '');
            const dlcAction = (rawActionData.length / 2).toString(16).toUpperCase();
            const cmd = `${rule.actionId.length <= 3 ? 't' : 'T'}${rule.actionId.padStart(rule.actionId.length <= 3 ? 3 : 8, '0')}${dlcAction}${rawActionData}`;
            sendLawicell(cmd);
          }
        }
      });

      const existing = messagesRef.current.get(id);
      messagesRef.current.set(id, {
        id,
        data: dataFormatted || "00",
        count: (existing?.count || 0) + 1,
        timestamp: Date.now(),
        isExtended: !isStandard
      });
    } catch (e) {}
  };

  const handleCharacteristicValueChange = (event: any) => {
    const value = event.target.value;
    const chunk = new TextDecoder().decode(value);
    dataBufferRef.current += chunk;
    if (dataBufferRef.current.includes('\r')) {
      const parts = dataBufferRef.current.split('\r');
      dataBufferRef.current = parts.pop() || "";
      parts.forEach(frame => parseLawicellFrame(frame.trim()));
    }
  };

  const handleDeviceConnect = async (device: any) => {
    setDeviceName(device.name || 'BT ADAPTER');
    setConnectionStatus('connecting');
    setStep(AppStep.Monitor);
    try {
      const server = await device.gatt?.connect();
      gattServerRef.current = server;
      const services = await server.getPrimaryServices();
      for (const service of services) {
        const chars = await service.getCharacteristics();
        for (const c of chars) {
          if (c.properties.notify) rxCharRef.current = c;
          if (c.properties.write || c.properties.writeWithoutResponse) txCharRef.current = c;
        }
      }
      if (rxCharRef.current) {
        await rxCharRef.current.startNotifications();
        rxCharRef.current.addEventListener('characteristicvaluechanged', handleCharacteristicValueChange);
      }
      setConnectionStatus('connected');
    } catch (err) {
      setConnectionStatus('disconnected');
      setStep(AppStep.Bluetooth);
    }
  };

  const handleDisconnect = () => {
    txIntervalsRef.current.forEach(i => window.clearInterval(i));
    if (gattServerRef.current) gattServerRef.current.disconnect();
    setConnectionStatus('disconnected');
    setStep(AppStep.Bluetooth);
    messagesRef.current.clear();
    logsRef.current = [];
    setComLogs([]);
  };

  return (
    <div className="h-full w-full bg-zinc-900 text-zinc-100 flex flex-col overflow-hidden">
      {step === AppStep.Splash && <SplashScreen onNext={() => setStep(AppStep.Bluetooth)} />}
      {step === AppStep.Bluetooth && <BluetoothConnection onConnect={handleDeviceConnect} />}
      {step === AppStep.Monitor && (
        <CanMonitor 
          deviceName={deviceName || 'CAN Adapter'} 
          connectionStatus={connectionStatus}
          speed={canSpeed}
          onSpeedChange={setCanSpeed}
          isCanOpen={isCanOpen}
          onToggleCan={async (open) => {
             if (open) {
                const sCmd = canSpeed === '125' ? 'S4' : canSpeed === '250' ? 'S5' : 'S6';
                await sendLawicell('C');
                await new Promise(r => setTimeout(r, 100));
                await sendLawicell(sCmd);
                await new Promise(r => setTimeout(r, 100));
                await sendLawicell('O');
                setIsCanOpen(true);
             } else {
                await sendLawicell('C');
                setIsCanOpen(false);
             }
          }}
          messages={displayMessages}
          onDisconnect={handleDisconnect}
          logs={displayLogs}
          comLogs={comLogs}
          onClearComLogs={() => setComLogs([])}
          comButtons={comButtons}
          onUpdateComButtons={setComButtons}
          onComButtonPress={async (btn) => {
            let sent = 0;
            const repeat = btn.repeatCount || 1;
            const period = btn.repeatPeriod || 0;
            
            if (repeat > 1 && period > 0) {
              const int = window.setInterval(() => {
                sendLawicell(btn.command);
                sent++;
                if (sent >= repeat) clearInterval(int);
              }, period);
            } else {
              for (let i = 0; i < repeat; i++) {
                await sendLawicell(btn.command);
                if (period > 0 && i < repeat - 1) await new Promise(r => setTimeout(r, period));
              }
            }
          }}
          isLoggingActive={isLoggingActive}
          onToggleLogging={setIsLoggingActive}
          isLoggingPaused={isLoggingPaused}
          onToggleLogPause={() => setIsLoggingPaused(!isLoggingPaused)}
          onClearLogs={() => { logsRef.current = []; setDisplayLogs([]); }}
          onImportLogs={(newLogs) => { logsRef.current = newLogs; setDisplayLogs([...newLogs]); }}
          onSendCommand={sendLawicell}
          savedTxMessages={savedTxMessages}
          onSaveTxMessage={(msg) => setSavedTxMessages(prev => {
            const index = prev.findIndex(m => m.id_key === msg.id_key);
            if (index >= 0) {
              const n = [...prev]; n[index] = msg as SavedTransmitMessage; return n;
            }
            return [...prev, { ...msg, id_key: Date.now().toString() } as SavedTransmitMessage];
          })}
          onImportTxMessages={setSavedTxMessages}
          onDeleteSavedTx={(id) => setSavedTxMessages(prev => prev.filter(m => m.id_key !== id))}
          activeTxIds={activeTxIds}
          onTogglePeriodicTx={(msg) => {
            if (activeTxIds.has(msg.id_key)) {
              window.clearInterval(txIntervalsRef.current.get(msg.id_key));
              txIntervalsRef.current.delete(msg.id_key);
              setActiveTxIds(prev => { const n = new Set(prev); n.delete(msg.id_key); return n; });
            } else {
              const rawData = msg.data.replace(/\s/g, '');
              const cmd = `${msg.id.length <= 3 ? 't' : 'T'}${msg.id.padStart(msg.id.length <= 3 ? 3 : 8, '0')}${(rawData.length/2).toString(16).toUpperCase()}${rawData}`;
              sendLawicell(cmd);
              if (msg.period > 0) {
                const i = window.setInterval(() => sendLawicell(cmd), msg.period);
                txIntervalsRef.current.set(msg.id_key, i);
                setActiveTxIds(prev => new Set(prev).add(msg.id_key));
              }
            }
          }}
          rules={rules}
          onUpdateRules={setRules}
          graphConfigs={graphConfigs}
          onUpdateGraphConfigs={setGraphConfigs}
        />
      )}
    </div>
  );
};

export default App;