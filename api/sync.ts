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
const MAX_RECORDS = 50;
const MAX_RECORD_BYTES = 64 * 1024;

function validId(value: unknown, max = 120) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && /^[A-Za-z0-9._:-]+$/.test(value);
}

function authorized(req: VercelRequest) {
  const configured = process.env.NEUROFLEX_SYNC_SECRET;
  if (!configured) return true; // demo mode; production must configure the secret
  return req.headers['x-neuroflex-sync-secret'] === configured;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (!authorized(req)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const deviceId = typeof req.query.deviceId === 'string' ? req.query.deviceId : '';
    if (!validId(deviceId)) return res.status(400).json({ ok: false, error: 'deviceId is required' });
    const records = [...store.values()].filter(record => record.deviceId === deviceId);
    return res.status(200).json({ ok: true, records, mode: process.env.NEUROFLEX_SYNC_SECRET ? 'protected-prototype' : 'demo' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const raw = JSON.stringify(req.body ?? {});
  if (raw.length > MAX_RECORD_BYTES) return res.status(413).json({ ok: false, error: 'Request too large' });

  const deviceId = typeof req.body?.deviceId === 'string' ? req.body.deviceId : '';
  const incoming = Array.isArray(req.body?.records) ? req.body.records as SyncRecord[] : [];
  if (!validId(deviceId) || incoming.length > MAX_RECORDS) {
    return res.status(400).json({ ok: false, error: 'Invalid sync request' });
  }

  for (const record of incoming) {
    if (!record || !validId(record.localId) || !validId(record.recordType) || record.deviceId !== deviceId) {
      return res.status(400).json({ ok: false, error: 'Invalid record' });
    }
    const version = Number(record.version);
    if (!Number.isSafeInteger(version) || version < 0) return res.status(400).json({ ok: false, error: 'Invalid version' });

    const key = deviceId + ':' + record.recordType + ':' + record.localId;
    const existing = store.get(key);
    if (!existing || version >= existing.version) {
      store.set(key, { ...record, status: 'SYNCED' });
    }
  }

  const records = [...store.values()].filter(record => record.deviceId === deviceId);
  return res.status(200).json({ ok: true, records, synced: incoming.length, mode: process.env.NEUROFLEX_SYNC_SECRET ? 'protected-prototype' : 'demo' });
}
