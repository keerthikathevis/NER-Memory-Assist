const DB_NAME = 'ner-memory-assist-local';
const STORE_NAME = 'records';
const DB_VERSION = 1;

type MirroredRecord = { key: string; value: unknown; updatedAt: number };

const openDb = (): Promise<IDBDatabase | null> => new Promise((resolve) => {
  if (typeof indexedDB === 'undefined') return resolve(null);
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => resolve(null);
});

export const mirrorRecord = async (key: string, value: unknown) => {
  const db = await openDb();
  if (!db) return;
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put({ key, value, updatedAt: Date.now() } satisfies MirroredRecord);
};

export const removeMirroredRecord = async (key: string) => {
  const db = await openDb();
  if (!db) return;
  db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key);
};

export const clearMirroredRecords = async () => {
  const db = await openDb();
  if (!db) return;
  db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
};