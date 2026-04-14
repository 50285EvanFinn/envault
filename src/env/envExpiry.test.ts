import {
  createEmptyExpiryStore,
  setExpiry,
  removeExpiry,
  getExpiry,
  isExpired,
  getExpiredKeys,
  purgeExpiredFromStore,
} from './envExpiry';

describe('envExpiry', () => {
  describe('createEmptyExpiryStore', () => {
    it('returns a store with empty records', () => {
      const store = createEmptyExpiryStore();
      expect(store.records).toEqual([]);
    });
  });

  describe('setExpiry', () => {
    it('adds an expiry record for a key', () => {
      const store = createEmptyExpiryStore();
      const updated = setExpiry(store, 'API_KEY', 60_000);
      expect(updated.records).toHaveLength(1);
      expect(updated.records[0].key).toBe('API_KEY');
    });

    it('replaces existing expiry for the same key', () => {
      let store = createEmptyExpiryStore();
      store = setExpiry(store, 'API_KEY', 60_000);
      store = setExpiry(store, 'API_KEY', 120_000);
      expect(store.records).toHaveLength(1);
      expect(store.records[0].expiresAt).toBeGreaterThan(
        store.records[0].createdAt + 60_000
      );
    });

    it('does not mutate the original store', () => {
      const store = createEmptyExpiryStore();
      setExpiry(store, 'API_KEY', 60_000);
      expect(store.records).toHaveLength(0);
    });
  });

  describe('removeExpiry', () => {
    it('removes the expiry record for a key', () => {
      let store = createEmptyExpiryStore();
      store = setExpiry(store, 'API_KEY', 60_000);
      store = removeExpiry(store, 'API_KEY');
      expect(store.records).toHaveLength(0);
    });

    it('returns unchanged store if key not found', () => {
      const store = createEmptyExpiryStore();
      const updated = removeExpiry(store, 'MISSING');
      expect(updated.records).toHaveLength(0);
    });
  });

  describe('isExpired', () => {
    it('returns false when key has no expiry', () => {
      const store = createEmptyExpiryStore();
      expect(isExpired(store, 'API_KEY')).toBe(false);
    });

    it('returns false when key has not yet expired', () => {
      const store = setExpiry(createEmptyExpiryStore(), 'API_KEY', 60_000);
      expect(isExpired(store, 'API_KEY')).toBe(false);
    });

    it('returns true when key has expired', () => {
      const store = setExpiry(createEmptyExpiryStore(), 'API_KEY', -1);
      expect(isExpired(store, 'API_KEY')).toBe(true);
    });
  });

  describe('getExpiredKeys', () => {
    it('returns all expired keys', () => {
      let store = createEmptyExpiryStore();
      store = setExpiry(store, 'OLD_KEY', -1);
      store = setExpiry(store, 'NEW_KEY', 60_000);
      const expired = getExpiredKeys(store);
      expect(expired).toContain('OLD_KEY');
      expect(expired).not.toContain('NEW_KEY');
    });
  });

  describe('purgeExpiredFromStore', () => {
    it('removes expired records and retains valid ones', () => {
      let store = createEmptyExpiryStore();
      store = setExpiry(store, 'OLD_KEY', -1);
      store = setExpiry(store, 'NEW_KEY', 60_000);
      const purged = purgeExpiredFromStore(store);
      expect(purged.records).toHaveLength(1);
      expect(purged.records[0].key).toBe('NEW_KEY');
    });
  });
});
