import type { VercelRequest, VercelResponse } from '@vercel/node';

type SyncRecord = {
  localId: string;
  recordType: string;
  payload: unknown;
  createdAt: number;
  updatedAt: number;
  deviceId: string;
  status: string;
  version: number;
};

const store = new Map<string, SyncRecord>();

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : '';
    const records = [...store.values()].filter((record) => !deviceId || record.deviceId === deviceId);
    return res.status(200).json({ ok: true, records, mode: 'prototype' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const incoming = Array.isArray(req.body?.records) ? req.body.records as SyncRecord[] : [];
  for (const record of incoming) {
    if (!record?.localId || !record?.recordType || !record?.deviceId) continue;
    const key = record.deviceId + ':' + record.recordType + ':' + record.localId;
    const existing = store.get(key);
    if (!existing || record.version >= existing.version) {
      store.set(key, { ...record, status: 'SYNCED' });
    }
  }

  const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId : '';
  const records = [...store.values()].filter((record) => !deviceId || record.deviceId === deviceId);
  return res.status(200).json({ ok: true, records, synced: incoming.length, mode: 'prototype' });
}
