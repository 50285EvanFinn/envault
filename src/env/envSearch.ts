import { VaultData } from './envEntry';

export interface SearchResult {
  key: string;
  value?: string;
}

/**
 * Search vault entries by key pattern (case-insensitive regex).
 */
export function searchEntries(
  vault: VaultData,
  pattern: string,
  includeValues = false
): SearchResult[] {
  const regex = new RegExp(pattern, 'i');
  const results: SearchResult[] = [];

  for (const key of Object.keys(vault)) {
    if (regex.test(key)) {
      results.push(includeValues ? { key, value: vault[key].value } : { key });
    }
  }

  return results;
}

/**
 * Search vault entries by value pattern (case-insensitive regex).
 */
export function searchByValue(
  vault: VaultData,
  pattern: string
): SearchResult[] {
  const regex = new RegExp(pattern, 'i');
  const results: SearchResult[] = [];

  for (const key of Object.keys(vault)) {
    const entry = vault[key];
    if (entry.value && regex.test(entry.value)) {
      results.push({ key, value: entry.value });
    }
  }

  return results;
}

/**
 * Count how many keys match a given pattern.
 */
export function countMatches(vault: VaultData, pattern: string): number {
  return searchEntries(vault, pattern).length;
}
