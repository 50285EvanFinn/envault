import {
  createEmptyBackupStore,
  createBackup,
  addBackup,
  removeBackup,
  getBackup,
  listBackups,
  pruneBackups,
} from './envBackup';
import { VaultPayload } from '../storage/vaultFile';

const mockPayload: VaultPayload = {
  entries: {},
  history: [],
  tags: {},
  aliases: {},
  profiles: {},
  locks: {},
  expiry: {},
  notes: {},
  groups: {},
  audit: [],
  templates: {},
  validations: {},
  webhooks: {},
  dependencies: {},
  access: {},
  schedules: {},
  snapshots: {},
  backups: { backups: [] },
} as unknown as VaultPayload;

describe('envBackup', () => {
  it('creates an empty backup store', () => {
    const store = createEmptyBackupStore();
    expect(store.backups).toHaveLength(0);
  });

  it('creates a backup record with unique id', () => {
    const r1 = createBackup('first', mockPayload);
    const r2 = createBackup('second', mockPayload);
    expect(r1.id).not.toBe(r2.id);
    expect(r1.label).toBe('first');
    expect(r1.payload).toBe(mockPayload);
  });

  it('adds a backup to the store', () => {
    let store = createEmptyBackupStore();
    const record = createBackup('v1', mockPayload);
    store = addBackup(store, record);
    expect(store.backups).toHaveLength(1);
  });

  it('removes a backup by id', () => {
    let store = createEmptyBackupStore();
    const record = createBackup('v1', mockPayload);
    store = addBackup(store, record);
    store = removeBackup(store, record.id);
    expect(store.backups).toHaveLength(0);
  });

  it('gets a backup by id', () => {
    let store = createEmptyBackupStore();
    const record = createBackup('v1', mockPayload);
    store = addBackup(store, record);
    expect(getBackup(store, record.id)).toEqual(record);
    expect(getBackup(store, 'nonexistent')).toBeUndefined();
  });

  it('lists backups sorted newest first', () => {
    let store = createEmptyBackupStore();
    const r1 = createBackup('old', mockPayload);
    await new Promise((r) => setTimeout(r, 5));
    const r2 = createBackup('new', mockPayload);
    store = addBackup(addBackup(store, r1), r2);
    const list = listBackups(store);
    expect(list[0].label).toBe('new');
  });

  it('prunes backups keeping only maxCount newest', () => {
    let store = createEmptyBackupStore();
    for (let i = 0; i < 5; i++) {
      store = addBackup(store, createBackup(`v${i}`, mockPayload));
    }
    const pruned = pruneBackups(store, 3);
    expect(pruned.backups).toHaveLength(3);
  });
});
