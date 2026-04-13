import {
  createHistoryRecord,
  appendHistory,
  filterHistoryByKey,
  filterHistoryByAction,
  createEmptyHistory,
  VaultHistory,
} from './envHistory';

describe('envHistory', () => {
  describe('createHistoryRecord', () => {
    it('creates a record with correct fields', () => {
      const record = createHistoryRecord('API_KEY', 'set', undefined, 'abc123');
      expect(record.key).toBe('API_KEY');
      expect(record.action).toBe('set');
      expect(record.previousValue).toBeUndefined();
      expect(record.newValue).toBe('abc123');
      expect(typeof record.timestamp).toBe('number');
    });

    it('includes previousValue on delete', () => {
      const record = createHistoryRecord('DB_URL', 'delete', 'old-value');
      expect(record.previousValue).toBe('old-value');
      expect(record.newValue).toBeUndefined();
    });
  });

  describe('appendHistory', () => {
    it('prepends new record to history', () => {
      const history = createEmptyHistory();
      const record = createHistoryRecord('KEY', 'set', undefined, 'val');
      const updated = appendHistory(history, record);
      expect(updated.records[0]).toEqual(record);
      expect(updated.records.length).toBe(1);
    });

    it('respects maxRecords limit', () => {
      let history = createEmptyHistory();
      for (let i = 0; i < 5; i++) {
        const r = createHistoryRecord(`KEY_${i}`, 'set', undefined, `val_${i}`);
        history = appendHistory(history, r, 3);
      }
      expect(history.records.length).toBe(3);
    });
  });

  describe('filterHistoryByKey', () => {
    it('returns only records matching key', () => {
      let history = createEmptyHistory();
      history = appendHistory(history, createHistoryRecord('A', 'set', undefined, '1'));
      history = appendHistory(history, createHistoryRecord('B', 'set', undefined, '2'));
      history = appendHistory(history, createHistoryRecord('A', 'delete', '1'));
      const result = filterHistoryByKey(history, 'A');
      expect(result.length).toBe(2);
      expect(result.every((r) => r.key === 'A')).toBe(true);
    });
  });

  describe('filterHistoryByAction', () => {
    it('returns only records matching action', () => {
      let history = createEmptyHistory();
      history = appendHistory(history, createHistoryRecord('A', 'set', undefined, '1'));
      history = appendHistory(history, createHistoryRecord('B', 'delete', '2'));
      history = appendHistory(history, createHistoryRecord('C', 'set', undefined, '3'));
      const result = filterHistoryByAction(history, 'set');
      expect(result.length).toBe(2);
    });
  });

  describe('createEmptyHistory', () => {
    it('returns history with empty records', () => {
      const history = createEmptyHistory();
      expect(history.records).toEqual([]);
    });
  });
});
