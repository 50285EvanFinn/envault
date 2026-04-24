import { VaultPayload } from '../storage/vaultFile';

export interface BackupRecord {
  id: string;
  label: string;
  createdAt: string;
  payload: VaultPayload;
}

export interface BackupStore {
  backups: BackupRecord[];
}

export function createEmptyBackupStore(): BackupStore {
  return { backups: [] };
}

export function createBackup(
  label: string,
  payload: VaultPayload
): BackupRecord {
  return {
    id: `backup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    label,
    createdAt: new Date().toISOString(),
    payload,
  };
}

export function addBackup(
  store: BackupStore,
  record: BackupRecord
): BackupStore {
  return { backups: [...store.backups, record] };
}

export function removeBackup(
  store: BackupStore,
  id: string
): BackupStore {
  return { backups: store.backups.filter((b) => b.id !== id) };
}

export function getBackup(
  store: BackupStore,
  id: string
): BackupRecord | undefined {
  return store.backups.find((b) => b.id === id);
}

export function listBackups(store: BackupStore): BackupRecord[] {
  return [...store.backups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function pruneBackups(
  store: BackupStore,
  maxCount: number
): BackupStore {
  const sorted = listBackups(store);
  const kept = sorted.slice(0, maxCount);
  return { backups: kept };
}
