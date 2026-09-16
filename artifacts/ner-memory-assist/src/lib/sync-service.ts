export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';

export type SyncRecord = {
  localId: string;
  recordType: string;
  payload: unknown;
  createdAt: number;
  updatedAt: number;
  deviceId: string;
  status: SyncStatus;
  version: number;
};

const QUEUE_KEY = 'ner-sync-queue';
const DEVICE_KEY = 'ner-device-id';

const getDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const next = `device-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;
  localStorage.setItem(DEVICE_KEY, next);
  return next;
};

export const getSyncQueue = (): SyncRecord[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) as SyncRecord[] : [];
  } catch {
    return [];
  }
};

const saveQueue = (queue: SyncRecord[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-200)));

export const queueChange = (recordType: string, payload: unknown, localId = recordType) => {
  if (typeof localStorage === 'undefined') return;
  const now = Date.now();
  const queue = getSyncQueue();
  const current = queue.find((record) => record.localId === localId && record.recordType === recordType);
  const next: SyncRecord = {
    localId,
    recordType,
    payload,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    deviceId: getDeviceId(),
    status: current?.status === 'CONFLICT' ? 'CONFLICT' : 'PENDING',
    version: (current?.version ?? 0) + 1,
  };
  saveQueue([...queue.filter((record) => !(record.localId === localId && record.recordType === recordType)), next]);
  window.dispatchEvent(new Event('ner-sync-updated'));
};

export const resolveSyncConflict = (localId: string, recordType: string, keep: 'local' | 'remote') => {
  const queue = getSyncQueue();
  const next = queue.map((record) => record.localId === localId && record.recordType === recordType
    ? { ...record, status: keep === 'local' ? 'PENDING' as const : 'SYNCED' as const, updatedAt: Date.now(), version: record.version + 1 }
    : record);
  saveQueue(next);
  window.dispatchEvent(new Event('ner-sync-updated'));
};

export const clearSyncQueue = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new Event('ner-sync-updated'));
};

export class SyncService {
  // This intentionally does not contact a server yet. It is the seam for a
  // future authenticated FastAPI/PostgreSQL sync implementation.
  async processQueue() {
    const queue = getSyncQueue();
    return { processed: 0, pending: queue.filter((record) => record.status === 'PENDING').length };
  }
}

export const syncService = new SyncService();