import { Vault, EnvEntry } from './envEntry';
import { createEntry, updateEntry } from './envEntry';

export function getEntry(vault: Vault, key: string): EnvEntry | undefined {
  return vault.entries[key];
}

export function setEntry(vault: Vault, key: string, value: string): Vault {
  const existing = vault.entries[key];
  const entry = existing
    ? updateEntry(existing, value)
    : createEntry(key, value);
  return {
    ...vault,
    entries: {
      ...vault.entries,
      [key]: entry,
    },
  };
}

export function removeEntry(vault: Vault, key: string): Vault {
  const { [key]: _, ...rest } = vault.entries;
  return { ...vault, entries: rest };
}

export function listEntries(vault: Vault): EnvEntry[] {
  return Object.values(vault.entries);
}

export function hasEntry(vault: Vault, key: string): boolean {
  return key in vault.entries;
}

export function mergeVaults(
  base: Vault,
  incoming: Vault,
  strategy: 'overwrite' | 'skip' = 'overwrite'
): Vault {
  let result = { ...base };
  for (const [key, entry] of Object.entries(incoming.entries)) {
    if (strategy === 'skip' && hasEntry(result, key)) {
      continue;
    }
    result = setEntry(result, key, entry.value);
  }
  return result;
}

export function filterEntries(vault: Vault, predicate: (entry: EnvEntry) => boolean): Vault {
  const filtered = Object.fromEntries(
    Object.entries(vault.entries).filter(([, entry]) => predicate(entry))
  );
  return { ...vault, entries: filtered };
}

export function countEntries(vault: Vault): number {
  return Object.keys(vault.entries).length;
}
