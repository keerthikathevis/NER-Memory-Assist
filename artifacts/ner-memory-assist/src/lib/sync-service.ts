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

const API_URL = '/api/sync';

export class SyncService {
  // Prototype cloud sync: local-first data remains available offline, while
  // pending records are mirrored to the Vercel server when connectivity exists.
  async processQueue() {
    const queue = getSyncQueue();
    const pending = queue.filter((record) => record.status === 'PENDING' || record.status === 'SYNCING');
    if (!pending.length || typeof fetch === 'undefined') {
      return { processed: 0, pending: queue.filter((record) => record.status === 'PENDING').length };
    }

    try {
      pending.forEach((record) => { record.status = 'SYNCING'; });
      saveQueue(queue);

      const deviceId = pending[0]?.deviceId ?? '';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, records: pending }),
      });
      if (!response.ok) throw new Error('Sync request failed');

      const result = await response.json() as { records?: SyncRecord[] };
      const syncedKeys = new Set((result.records ?? []).map((record) => `${record.recordType}:${record.localId}`));
      const next = getSyncQueue().map((record) => {
        const key = `${record.recordType}:${record.localId}`;
        return syncedKeys.has(key) && record.status === 'SYNCING'
          ? { ...record, status: 'SYNCED' as const }
          : record;
      });
      saveQueue(next);
      window.dispatchEvent(new Event('ner-sync-updated'));
      return { processed: pending.length, pending: next.filter((record) => record.status === 'PENDING').length };
    } catch {
      const next = getSyncQueue().map((record) =>
        record.status === 'SYNCING' ? { ...record, status: 'PENDING' as const } : record
      );
      saveQueue(next);
      return { processed: 0, pending: next.filter((record) => record.status === 'PENDING').length };
    }
  }
}

export const syncService = new SyncService();

export const syncService = new SyncService();