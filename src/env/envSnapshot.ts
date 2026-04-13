import { VaultPayload } from '../storage/vaultFile';

export interface Snapshot {
  id: string;
  label: string;
  createdAt: string;
  entries: Record<string, { value: string; updatedAt: string }>;
}

export interface SnapshotStore {
  snapshots: Snapshot[];
}

export function createEmptySnapshotStore(): SnapshotStore {
  return { snapshots: [] };
}

export function createSnapshot(vault: VaultPayload, label: string): Snapshot {
  const id = `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entries: Snapshot['entries'] = {};

  for (const [key, entry] of Object.entries(vault.entries)) {
    entries[key] = { value: entry.value, updatedAt: entry.updatedAt };
  }

  return {
    id,
    label,
    createdAt: new Date().toISOString(),
    entries,
  };
}

export function addSnapshot(store: SnapshotStore, snapshot: Snapshot): SnapshotStore {
  return {
    snapshots: [...store.snapshots, snapshot],
  };
}

export function removeSnapshot(store: SnapshotStore, id: string): SnapshotStore {
  return {
    snapshots: store.snapshots.filter((s) => s.id !== id),
  };
}

export function getSnapshot(store: SnapshotStore, id: string): Snapshot | undefined {
  return store.snapshots.find((s) => s.id === id);
}

export function listSnapshots(store: SnapshotStore): Snapshot[] {
  return [...store.snapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
