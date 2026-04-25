/**
 * envPin.ts
 * Manage pinned (favorite) environment variable keys within a vault.
 */

export interface PinStore {
  pins: string[];
}

export function createEmptyPinStore(): PinStore {
  return { pins: [] };
}

export function pinKey(store: PinStore, key: string): PinStore {
  if (store.pins.includes(key)) return store;
  return { pins: [...store.pins, key] };
}

export function unpinKey(store: PinStore, key: string): PinStore {
  return { pins: store.pins.filter((k) => k !== key) };
}

export function isPinned(store: PinStore, key: string): boolean {
  return store.pins.includes(key);
}

export function listPins(store: PinStore): string[] {
  return [...store.pins];
}

export function clearPins(store: PinStore): PinStore {
  return { pins: [] };
}

export function reorderPin(
  store: PinStore,
  key: string,
  toIndex: number
): PinStore {
  const pins = store.pins.filter((k) => k !== key);
  const clamped = Math.max(0, Math.min(toIndex, pins.length));
  pins.splice(clamped, 0, key);
  return { pins };
}
