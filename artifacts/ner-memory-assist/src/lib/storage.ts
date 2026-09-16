import type { GameResult } from './adaptive-engine';
import { demoMemoryProfiles } from './game-data';
import { defaultMedicineSchedules, type MedicineEvent, type MedicineSchedule } from './medicine';
import { clearMirroredRecords, mirrorRecord } from './indexed-db';
import { queueChange } from './sync-service';

export type MemoryProfile = {
  id: string;
  name: string;
  relationship: string;
  voiceNote: string;
  description: string;
  photoDataUrl: string;
  voiceNoteDataUrl?: string;
};

export const readStore = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStore = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    const syncTypes: Record<string, string> = {
      'ner-medicine-schedules': 'medicine-schedules',
      'ner-medicine-events': 'medicine-events',
      'ner-memory-profiles': 'memory-profiles',
      'ner-game-results': 'game-results',
      'ner-music-favorites': 'music-preferences',
      'ner-music-volume': 'music-preferences',
    };
    const recordType = syncTypes[key];
    if (recordType) queueChange(recordType, value, key);
    if (recordType) void mirrorRecord(key, value);
  } catch {
    // Local-first data is best effort when storage is unavailable or full.
  }
};

export const getMemoryProfiles = (): MemoryProfile[] =>
  readStore<MemoryProfile[]>('ner-memory-profiles', demoMemoryProfiles);

export const getGameResults = (): GameResult[] => readStore<GameResult[]>('ner-game-results', []);

export const saveGameResult = (result: GameResult) => {
  writeStore('ner-game-results', [...getGameResults(), result].slice(-100));
};

export const getMedicineSchedules = (): MedicineSchedule[] =>
  readStore<MedicineSchedule[]>('ner-medicine-schedules', defaultMedicineSchedules());

export const saveMedicineSchedules = (schedules: MedicineSchedule[]) => {
  writeStore('ner-medicine-schedules', schedules);
};

export const getMedicineEvents = (): MedicineEvent[] =>
  readStore<MedicineEvent[]>('ner-medicine-events', []);

export const saveMedicineEvent = (event: MedicineEvent) => {
  writeStore('ner-medicine-events', [...getMedicineEvents(), event].slice(-500));
};

export const clearMedicineData = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('ner-medicine-schedules');
  localStorage.removeItem('ner-medicine-events');
  void clearMirroredRecords();
};

export const clearLocalDataMirror = () => {
  void clearMirroredRecords();
};
