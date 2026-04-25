import {
  createEmptyEncodingStore,
  setEncoding,
  removeEncoding,
  getEncoding,
  encodeValue,
  decodeValue,
  listEncodings,
} from './envEncoding';

describe('envEncoding', () => {
  describe('createEmptyEncodingStore', () => {
    it('returns a store with no encodings', () => {
      const store = createEmptyEncodingStore();
      expect(store.encodings).toEqual({});
    });
  });

  describe('setEncoding', () => {
    it('adds an encoding for a key', () => {
      const store = createEmptyEncodingStore();
      const updated = setEncoding(store, 'SECRET', 'base64');
      expect(updated.encodings['SECRET']).toBe('base64');
    });

    it('does not mutate the original store', () => {
      const store = createEmptyEncodingStore();
      setEncoding(store, 'SECRET', 'hex');
      expect(store.encodings['SECRET']).toBeUndefined();
    });
  });

  describe('removeEncoding', () => {
    it('removes an existing encoding', () => {
      let store = createEmptyEncodingStore();
      store = setEncoding(store, 'SECRET', 'base64');
      const updated = removeEncoding(store, 'SECRET');
      expect(updated.encodings['SECRET']).toBeUndefined();
    });

    it('is a no-op for unknown keys', () => {
      const store = createEmptyEncodingStore();
      const updated = removeEncoding(store, 'MISSING');
      expect(updated.encodings).toEqual({});
    });
  });

  describe('getEncoding', () => {
    it('returns the format for a known key', () => {
      let store = createEmptyEncodingStore();
      store = setEncoding(store, 'TOKEN', 'hex');
      expect(getEncoding(store, 'TOKEN')).toBe('hex');
    });

    it('returns undefined for unknown key', () => {
      const store = createEmptyEncodingStore();
      expect(getEncoding(store, 'UNKNOWN')).toBeUndefined();
    });
  });

  describe('encodeValue / decodeValue', () => {
    const original = 'hello world';

    it('round-trips base64 encoding', () => {
      const encoded = encodeValue(original, 'base64');
      expect(decodeValue(encoded, 'base64')).toBe(original);
    });

    it('round-trips hex encoding', () => {
      const encoded = encodeValue(original, 'hex');
      expect(decodeValue(encoded, 'hex')).toBe(original);
    });

    it('round-trips utf8 encoding (identity)', () => {
      const encoded = encodeValue(original, 'utf8');
      expect(encoded).toBe(original);
      expect(decodeValue(encoded, 'utf8')).toBe(original);
    });
  });

  describe('listEncodings', () => {
    it('returns all key/format pairs', () => {
      let store = createEmptyEncodingStore();
      store = setEncoding(store, 'A', 'base64');
      store = setEncoding(store, 'B', 'hex');
      const list = listEncodings(store);
      expect(list).toHaveLength(2);
      expect(list).toContainEqual({ key: 'A', format: 'base64' });
      expect(list).toContainEqual({ key: 'B', format: 'hex' });
    });

    it('returns empty array for empty store', () => {
      const store = createEmptyEncodingStore();
      expect(listEncodings(store)).toEqual([]);
    });
  });
});
