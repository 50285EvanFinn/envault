import {
  createEmptySnapshotStore,
  createSnapshot,
  addSnapshot,
  removeSnapshot,
  getSnapshot,
  listSnapshots,
} from './envSnapshot';
import { VaultPayload } from '../storage/vaultFile';

const mockVault = {
  version: 1,
  entries: {
    API_KEY: { value: 'abc123', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' },
    DB_URL: { value: 'postgres://localhost', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
  },
} as VaultPayload;

describe('createEmptySnapshotStore', () => {
  it('returns empty snapshots array', () => {
    expect(createEmptySnapshotStore().snapshots).toHaveLength(0);
  });
});

describe('createSnapshot', () => {
  it('captures all entries', () => {
    const snap = createSnapshot(mockVault, 'test');
    expect(Object.keys(snap.entries)).toEqual(['API_KEY', 'DB_URL']);
  });

  it('assigns a unique id with snap_ prefix', () => {
    const s1 = createSnapshot(mockVault, 'a');
    const s2 = createSnapshot(mockVault, 'b');
    expect(s1.id).toMatch(/^snap_/);
    expect(s1.id).not.toBe(s2.id);
  });

  it('stores the label', () => {
    const snap = createSnapshot(mockVault, 'my-label');
    expect(snap.label).toBe('my-label');
  });
});

describe('addSnapshot', () => {
  it('does not mutate original store', () => {
    const store = createEmptySnapshotStore();
    const snap = createSnapshot(mockVault, 'v1');
    addSnapshot(store, snap);
    expect(store.snapshots).toHaveLength(0);
  });
});

describe('removeSnapshot', () => {
  it('removes only the target snapshot', () => {
    let store = createEmptySnapshotStore();
    const s1 = createSnapshot(mockVault, 'first');
    const s2 = createSnapshot(mockVault, 'second');
    store = addSnapshot(store, s1);
    store = addSnapshot(store, s2);
    store = removeSnapshot(store, s1.id);
    expect(store.snapshots).toHaveLength(1);
    expect(store.snapshots[0].label).toBe('second');
  });
});

describe('listSnapshots', () => {
  it('returns newest first', () => {
    let store = createEmptySnapshotStore();
    const s1 = { ...createSnapshot(mockVault, 'old'), createdAt: '2024-01-01T00:00:00.000Z' };
    const s2 = { ...createSnapshot(mockVault, 'new'), createdAt: '2024-06-01T00:00:00.000Z' };
    store = addSnapshot(store, s1);
    store = addSnapshot(store, s2);
    const list = listSnapshots(store);
    expect(list[0].label).toBe('new');
  });
});
