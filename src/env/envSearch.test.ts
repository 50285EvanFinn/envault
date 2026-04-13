import { searchEntries, searchByValue, countMatches } from './envSearch';
import { VaultData } from './envEntry';

const sampleVault: VaultData = {
  DB_HOST: { value: 'localhost', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  DB_PORT: { value: '5432', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  API_KEY: { value: 'secret-key', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  API_URL: { value: 'https://api.example.com', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  SECRET_TOKEN: { value: 'token123', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
};

describe('searchEntries', () => {
  it('returns keys matching pattern', () => {
    const results = searchEntries(sampleVault, 'DB');
    expect(results.map((r) => r.key)).toEqual(['DB_HOST', 'DB_PORT']);
  });

  it('is case-insensitive', () => {
    const results = searchEntries(sampleVault, 'db');
    expect(results).toHaveLength(2);
  });

  it('returns empty array when no matches', () => {
    const results = searchEntries(sampleVault, 'NONEXISTENT');
    expect(results).toHaveLength(0);
  });

  it('does not include values by default', () => {
    const results = searchEntries(sampleVault, 'DB_HOST');
    expect(results[0].value).toBeUndefined();
  });

  it('includes values when requested', () => {
    const results = searchEntries(sampleVault, 'DB_HOST', true);
    expect(results[0].value).toBe('localhost');
  });

  it('supports partial pattern matching', () => {
    const results = searchEntries(sampleVault, 'API');
    expect(results.map((r) => r.key)).toEqual(['API_KEY', 'API_URL']);
  });
});

describe('searchByValue', () => {
  it('returns entries whose values match the pattern', () => {
    const results = searchByValue(sampleVault, 'secret');
    expect(results.map((r) => r.key)).toContain('API_KEY');
  });

  it('always includes value in results', () => {
    const results = searchByValue(sampleVault, 'localhost');
    expect(results[0].value).toBe('localhost');
  });

  it('returns empty array when no value matches', () => {
    const results = searchByValue(sampleVault, 'nomatch');
    expect(results).toHaveLength(0);
  });
});

describe('countMatches', () => {
  it('returns correct count of matching keys', () => {
    expect(countMatches(sampleVault, 'API')).toBe(2);
  });

  it('returns 0 when no matches', () => {
    expect(countMatches(sampleVault, 'NOTHING')).toBe(0);
  });
});
