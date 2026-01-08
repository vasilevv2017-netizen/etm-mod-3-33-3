export enum AppStep { Splash = 0, Bluetooth = 1, Monitor = 2 }
export enum MonitorView { Live = 'LIVE', TX = 'TX', Logs = 'LOGS', Logic = 'LOGIC', ComPort = 'COM PORT', Graph = 'GRAPH' }

export interface CanMessage {
  id: string;
  data: string;
  count: number;
  timestamp: number;
  isExtended: boolean;
}

export type CanSpeed = '125' | '250' | '500';

export interface SavedTransmitMessage {
  id_key: string;
  name: string;
  id: string;
  data: string;
  period: number;
}

export interface CanRule {
  id: string;
  name: string;
  enabled: boolean;
  triggerId: string;
  triggerData: string;
  actionId: string;
  actionData: string;
}

export interface ComButton {
  id: string;
  name: string;
  command: string;
  mode: 'text' | 'hex';
  repeatCount: number;
  repeatPeriod: number;
}

export interface GraphConfig {
  id: string;
  canId: string;
  bitOffset: number;
  bitLength: number;
  minVal: number;
  maxVal: number;
  label: string;
}