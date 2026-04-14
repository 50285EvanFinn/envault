import { VaultPayload } from '../storage/vaultFile';

export interface ExpiryRecord {
  key: string;
  expiresAt: number; // Unix timestamp in ms
  createdAt: number;
}

export interface ExpiryStore {
  records: ExpiryRecord[];
}

export function createEmptyExpiryStore(): ExpiryStore {
  return { records: [] };
}

export function setExpiry(
  store: ExpiryStore,
  key: string,
  ttlMs: number
): ExpiryStore {
  const now = Date.now();
  const filtered = store.records.filter((r) => r.key !== key);
  return {
    records: [
      ...filtered,
      { key, expiresAt: now + ttlMs, createdAt: now },
    ],
  };
}

export function removeExpiry(store: ExpiryStore, key: string): ExpiryStore {
  return {
    records: store.records.filter((r) => r.key !== key),
  };
}

export function getExpiry(
  store: ExpiryStore,
  key: string
): ExpiryRecord | undefined {
  return store.records.find((r) => r.key === key);
}

export function isExpired(store: ExpiryStore, key: string): boolean {
  const record = getExpiry(store, key);
  if (!record) return false;
  return Date.now() > record.expiresAt;
}

export function getExpiredKeys(store: ExpiryStore): string[] {
  const now = Date.now();
  return store.records
    .filter((r) => now > r.expiresAt)
    .map((r) => r.key);
}

export function purgeExpiredFromStore(store: ExpiryStore): ExpiryStore {
  const now = Date.now();
  return {
    records: store.records.filter((r) => now <= r.expiresAt),
  };
}
