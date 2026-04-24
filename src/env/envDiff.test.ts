import { diffVaults, filterDiff, hasDifferences } from './envDiff';
import { VaultPayload } from '../storage/vaultFile';

function makeVault(entries: Record<string, string>): VaultPayload {
  const result: VaultPayload = { entries: {}, history: [], tags: {}, aliases: {} };
  for (const [key, value] of Object.entries(entries)) {
    result.entries[key] = { value, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' };
  }
  return result;
}

describe('diffVaults', () => {
  it('detects added keys', () => {
    const base = makeVault({ A: '1' });
    const target = makeVault({ A: '1', B: '2' });
    const result = diffVaults(base, target);
    expect(result.added).toBe(1);
    expect(result.records.find(r => r.key === 'B')?.action).toBe('added');
    expect(result.records.find(r => r.key === 'B')?.newValue).toBe('2');
  });

  it('detects removed keys', () => {
    const base = makeVault({ A: '1', B: '2' });
    const target = makeVault({ A: '1' });
    const result = diffVaults(base, target);
    expect(result.removed).toBe(1);
    expect(result.records.find(r => r.key === 'B')?.action).toBe('removed');
    expect(result.records.find(r => r.key === 'B')?.oldValue).toBe('2');
  });

  it('detects modified keys', () => {
    const base = makeVault({ A: '1' });
    const target = makeVault({ A: '99' });
    const result = diffVaults(base, target);
    expect(result.modified).toBe(1);
    const rec = result.records.find(r => r.key === 'A')!;
    expect(rec.action).toBe('modified');
    expect(rec.oldValue).toBe('1');
    expect(rec.newValue).toBe('99');
  });

  it('detects unchanged keys', () => {
    const base = makeVault({ A: '1' });
    const target = makeVault({ A: '1' });
    const result = diffVaults(base, target);
    expect(result.unchanged).toBe(1);
    expect(result.records[0].action).toBe('unchanged');
  });

  it('returns sorted keys', () => {
    const base = makeVault({ Z: '1', A: '2' });
    const target = makeVault({ Z: '1', A: '9' });
    const result = diffVaults(base, target);
    expect(result.records[0].key).toBe('A');
    expect(result.records[1].key).toBe('Z');
  });
});

describe('filterDiff', () => {
  it('filters by action', () => {
    const base = makeVault({ A: '1', B: '2' });
    const target = makeVault({ A: '99', C: '3' });
    const result = diffVaults(base, target);
    const added = filterDiff(result, ['added']);
    expect(added.length).toBe(1);
    expect(added[0].key).toBe('C');
  });
});

describe('hasDifferences', () => {
  it('returns true when there are differences', () => {
    const base = makeVault({ A: '1' });
    const target = makeVault({ A: '2' });
    expect(hasDifferences(diffVaults(base, target))).toBe(true);
  });

  it('returns false when vaults are identical', () => {
    const base = makeVault({ A: '1' });
    const target = makeVault({ A: '1' });
    expect(hasDifferences(diffVaults(base, target))).toBe(false);
  });
});
