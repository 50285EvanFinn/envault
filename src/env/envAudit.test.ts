import {
  createEmptyAuditStore,
  createAuditRecord,
  appendAuditRecord,
  filterAuditByKey,
  filterAuditByAction,
  getRecentAuditRecords,
  clearAuditStore,
} from './envAudit';

describe('envAudit', () => {
  describe('createEmptyAuditStore', () => {
    it('returns a store with no records', () => {
      const store = createEmptyAuditStore();
      expect(store.records).toHaveLength(0);
    });
  });

  describe('createAuditRecord', () => {
    it('creates a record with correct fields', () => {
      const record = createAuditRecord('API_KEY', 'read', true);
      expect(record.key).toBe('API_KEY');
      expect(record.action).toBe('read');
      expect(record.success).toBe(true);
      expect(record.timestamp).toBeDefined();
      expect(record.metadata).toBeUndefined();
    });

    it('includes metadata when provided', () => {
      const meta = { source: 'cli' };
      const record = createAuditRecord('DB_URL', 'write', true, meta);
      expect(record.metadata).toEqual(meta);
    });
  });

  describe('appendAuditRecord', () => {
    it('appends a record to the store', () => {
      let store = createEmptyAuditStore();
      const record = createAuditRecord('KEY', 'delete', true);
      store = appendAuditRecord(store, record);
      expect(store.records).toHaveLength(1);
      expect(store.records[0].key).toBe('KEY');
    });

    it('does not mutate the original store', () => {
      const store = createEmptyAuditStore();
      const record = createAuditRecord('KEY', 'read', false);
      appendAuditRecord(store, record);
      expect(store.records).toHaveLength(0);
    });
  });

  describe('filterAuditByKey', () => {
    it('returns only records matching the key', () => {
      let store = createEmptyAuditStore();
      store = appendAuditRecord(store, createAuditRecord('A', 'read', true));
      store = appendAuditRecord(store, createAuditRecord('B', 'write', true));
      store = appendAuditRecord(store, createAuditRecord('A', 'delete', false));
      const results = filterAuditByKey(store, 'A');
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.key === 'A')).toBe(true);
    });
  });

  describe('filterAuditByAction', () => {
    it('returns only records matching the action', () => {
      let store = createEmptyAuditStore();
      store = appendAuditRecord(store, createAuditRecord('A', 'read', true));
      store = appendAuditRecord(store, createAuditRecord('B', 'read', true));
      store = appendAuditRecord(store, createAuditRecord('C', 'write', true));
      const results = filterAuditByAction(store, 'read');
      expect(results).toHaveLength(2);
    });
  });

  describe('getRecentAuditRecords', () => {
    it('returns the last N records', () => {
      let store = createEmptyAuditStore();
      for (let i = 0; i < 5; i++) {
        store = appendAuditRecord(store, createAuditRecord(`KEY_${i}`, 'read', true));
      }
      const recent = getRecentAuditRecords(store, 3);
      expect(recent).toHaveLength(3);
      expect(recent[2].key).toBe('KEY_4');
    });
  });

  describe('clearAuditStore', () => {
    it('returns an empty store', () => {
      const cleared = clearAuditStore();
      expect(cleared.records).toHaveLength(0);
    });
  });
});
