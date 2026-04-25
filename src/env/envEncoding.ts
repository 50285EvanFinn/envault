/**
 * envEncoding.ts
 * Utilities for encoding/decoding env values in various formats (base64, hex, utf8).
 */

export type EncodingFormat = 'base64' | 'hex' | 'utf8';

export interface EncodingStore {
  encodings: Record<string, EncodingFormat>;
}

export function createEmptyEncodingStore(): EncodingStore {
  return { encodings: {} };
}

export function setEncoding(
  store: EncodingStore,
  key: string,
  format: EncodingFormat
): EncodingStore {
  return {
    ...store,
    encodings: { ...store.encodings, [key]: format },
  };
}

export function removeEncoding(
  store: EncodingStore,
  key: string
): EncodingStore {
  const { [key]: _, ...rest } = store.encodings;
  return { ...store, encodings: rest };
}

export function getEncoding(
  store: EncodingStore,
  key: string
): EncodingFormat | undefined {
  return store.encodings[key];
}

export function encodeValue(value: string, format: EncodingFormat): string {
  switch (format) {
    case 'base64':
      return Buffer.from(value, 'utf8').toString('base64');
    case 'hex':
      return Buffer.from(value, 'utf8').toString('hex');
    case 'utf8':
    default:
      return value;
  }
}

export function decodeValue(value: string, format: EncodingFormat): string {
  switch (format) {
    case 'base64':
      return Buffer.from(value, 'base64').toString('utf8');
    case 'hex':
      return Buffer.from(value, 'hex').toString('utf8');
    case 'utf8':
    default:
      return value;
  }
}

export function listEncodings(
  store: EncodingStore
): Array<{ key: string; format: EncodingFormat }> {
  return Object.entries(store.encodings).map(([key, format]) => ({ key, format }));
}
