import { formatAsDotenv, formatAsJson } from './export';

describe('formatAsDotenv', () => {
  it('formats entries as dotenv lines', () => {
    const entries = { API_KEY: 'abc123', DB_URL: 'postgres://localhost' };
    const result = formatAsDotenv(entries);
    expect(result).toContain('API_KEY="abc123"');
    expect(result).toContain('DB_URL="postgres://localhost"');
  });

  it('returns empty string for empty entries', () => {
    expect(formatAsDotenv({})).toBe('');
  });

  it('quotes values with spaces', () => {
    const result = formatAsDotenv({ MSG: 'hello world' });
    expect(result).toBe('MSG="hello world"');
  });
});

describe('formatAsJson', () => {
  it('formats entries as pretty JSON', () => {
    const entries = { FOO: 'bar' };
    const result = formatAsJson(entries);
    const parsed = JSON.parse(result);
    expect(parsed.FOO).toBe('bar');
  });

  it('returns empty JSON object for empty entries', () => {
    const result = formatAsJson({});
    expect(JSON.parse(result)).toEqual({});
  });

  it('preserves all keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    const result = JSON.parse(formatAsJson(entries));
    expect(Object.keys(result)).toHaveLength(3);
  });
});
