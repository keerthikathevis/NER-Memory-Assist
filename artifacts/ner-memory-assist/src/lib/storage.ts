import type { GameResult } from './adaptive-engine';
import { demoMemoryProfiles } from './game-data';
import { defaultMedicineSchedules, type MedicineEvent, type MedicineSchedule } from './medicine';

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
};
