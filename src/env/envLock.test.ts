import {
  createEmptyLockStore,
  lockKey,
  unlockKey,
  isLocked,
  getLockRecord,
  listLockedKeys,
} from './envLock';

describe('envLock', () => {
  it('creates an empty lock store', () => {
    const store = createEmptyLockStore();
    expect(store.lockedKeys).toEqual({});
  });

  it('locks a key', () => {
    const store = createEmptyLockStore();
    const updated = lockKey(store, 'API_KEY', 'sensitive');
    expect(isLocked(updated, 'API_KEY')).toBe(true);
    expect(updated.lockedKeys['API_KEY'].reason).toBe('sensitive');
    expect(updated.lockedKeys['API_KEY'].lockedAt).toBeDefined();
  });

  it('locks a key without a reason', () => {
    const store = createEmptyLockStore();
    const updated = lockKey(store, 'DB_PASS');
    expect(isLocked(updated, 'DB_PASS')).toBe(true);
    expect(updated.lockedKeys['DB_PASS'].reason).toBeUndefined();
  });

  it('unlocks a key', () => {
    let store = createEmptyLockStore();
    store = lockKey(store, 'API_KEY');
    store = unlockKey(store, 'API_KEY');
    expect(isLocked(store, 'API_KEY')).toBe(false);
  });

  it('does not mutate original store', () => {
    const original = createEmptyLockStore();
    lockKey(original, 'API_KEY');
    expect(Object.keys(original.lockedKeys)).toHaveLength(0);
  });

  it('returns lock record for a locked key', () => {
    let store = createEmptyLockStore();
    store = lockKey(store, 'SECRET', 'do not touch');
    const record = getLockRecord(store, 'SECRET');
    expect(record).toBeDefined();
    expect(record?.reason).toBe('do not touch');
  });

  it('returns undefined for an unlocked key', () => {
    const store = createEmptyLockStore();
    expect(getLockRecord(store, 'MISSING')).toBeUndefined();
  });

  it('lists all locked keys', () => {
    let store = createEmptyLockStore();
    store = lockKey(store, 'KEY_A');
    store = lockKey(store, 'KEY_B');
    expect(listLockedKeys(store)).toEqual(expect.arrayContaining(['KEY_A', 'KEY_B']));
    expect(listLockedKeys(store)).toHaveLength(2);
  });
});
