import type { GameResult } from './adaptive-engine';
import { demoMemoryProfiles } from './game-data';

export type MemoryProfile = {
  id: string;
  name: string;
  relationship: string;
  voiceNote: string;
  description: string;
  photoDataUrl: string;
};

export const readStore = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStore = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getMemoryProfiles = (): MemoryProfile[] =>
  readStore<MemoryProfile[]>('ner-memory-profiles', demoMemoryProfiles);

export const getGameResults = (): GameResult[] => readStore<GameResult[]>('ner-game-results', []);

export const saveGameResult = (result: GameResult) => {
  writeStore('ner-game-results', [...getGameResults(), result].slice(-100));
};
