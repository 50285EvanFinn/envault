export interface LockRecord {
  lockedAt: string;
  reason?: string;
}

export interface LockStore {
  lockedKeys: Record<string, LockRecord>;
}

export function createEmptyLockStore(): LockStore {
  return { lockedKeys: {} };
}

export function lockKey(
  store: LockStore,
  key: string,
  reason?: string
): LockStore {
  return {
    ...store,
    lockedKeys: {
      ...store.lockedKeys,
      [key]: { lockedAt: new Date().toISOString(), reason },
    },
  };
}

export function unlockKey(store: LockStore, key: string): LockStore {
  const { [key]: _, ...rest } = store.lockedKeys;
  return { ...store, lockedKeys: rest };
}

export function isLocked(store: LockStore, key: string): boolean {
  return key in store.lockedKeys;
}

export function getLockRecord(
  store: LockStore,
  key: string
): LockRecord | undefined {
  return store.lockedKeys[key];
}

export function listLockedKeys(store: LockStore): string[] {
  return Object.keys(store.lockedKeys);
}
