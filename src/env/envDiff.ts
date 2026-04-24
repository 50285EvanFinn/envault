import { VaultPayload } from '../storage/vaultFile';

export type DiffAction = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffRecord {
  key: string;
  action: DiffAction;
  oldValue?: string;
  newValue?: string;
}

export interface DiffResult {
  records: DiffRecord[];
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export function diffVaults(base: VaultPayload, target: VaultPayload): DiffResult {
  const records: DiffRecord[] = [];
  const baseKeys = new Set(Object.keys(base.entries ?? {}));
  const targetKeys = new Set(Object.keys(target.entries ?? {}));
  const allKeys = new Set([...baseKeys, ...targetKeys]);

  let added = 0, removed = 0, modified = 0, unchanged = 0;

  for (const key of allKeys) {
    const inBase = baseKeys.has(key);
    const inTarget = targetKeys.has(key);

    if (!inBase && inTarget) {
      records.push({ key, action: 'added', newValue: target.entries[key].value });
      added++;
    } else if (inBase && !inTarget) {
      records.push({ key, action: 'removed', oldValue: base.entries[key].value });
      removed++;
    } else if (inBase && inTarget) {
      const oldValue = base.entries[key].value;
      const newValue = target.entries[key].value;
      if (oldValue !== newValue) {
        records.push({ key, action: 'modified', oldValue, newValue });
        modified++;
      } else {
        records.push({ key, action: 'unchanged', oldValue, newValue });
        unchanged++;
      }
    }
  }

  records.sort((a, b) => a.key.localeCompare(b.key));
  return { records, added, removed, modified, unchanged };
}

export function filterDiff(result: DiffResult, actions: DiffAction[]): DiffRecord[] {
  return result.records.filter(r => actions.includes(r.action));
}

export function hasDifferences(result: DiffResult): boolean {
  return result.added > 0 || result.removed > 0 || result.modified > 0;
}
