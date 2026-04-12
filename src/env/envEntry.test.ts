import { describe, it, expect } from 'vitest';
import {
  createEntry,
  updateEntry,
  createEmptyVault,
} from './envEntry';

describe('envEntry', () => {
  it('creates an entry with correct key and value', () => {
    const entry = createEntry('MY_KEY', 'my_value');
    expect(entry.key).toBe('MY_KEY');
    expect(entry.value).toBe('my_value');
    expect(entry.createdAt).toBeTruthy();
    expect(entry.updatedAt).toBeTruthy();
  });

  it('sets createdAt and updatedAt to same time on creation', () => {
    const entry = createEntry('KEY', 'val');
    expect(entry.createdAt).toBe(entry.updatedAt);
  });

  it('updates value and updatedAt but preserves createdAt', async () => {
    const original = createEntry('KEY', 'old');
    await new Promise((r) => setTimeout(r, 5));
    const updated = updateEntry(original, 'new');
    expect(updated.value).toBe('new');
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).not.toBe(original.updatedAt);
  });

  it('creates an empty vault with version 1 and no entries', () => {
    const vault = createEmptyVault();
    expect(vault.version).toBe(1);
    expect(vault.entries).toEqual({});
  });
});
