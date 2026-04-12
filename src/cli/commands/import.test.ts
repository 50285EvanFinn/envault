import { parseDotenv } from './import';

describe('parseDotenv', () => {
  it('parses simple key=value pairs', () => {
    const result = parseDotenv('FOO=bar\nBAZ=qux');
    expect(result).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('strips double quotes from values', () => {
    const result = parseDotenv('API_KEY="my-secret"');
    expect(result.API_KEY).toBe('my-secret');
  });

  it('strips single quotes from values', () => {
    const result = parseDotenv("TOKEN='abc123'");
    expect(result.TOKEN).toBe('abc123');
  });

  it('ignores comment lines', () => {
    const result = parseDotenv('# this is a comment\nFOO=bar');
    expect(Object.keys(result)).toEqual(['FOO']);
  });

  it('ignores empty lines', () => {
    const result = parseDotenv('\n\nFOO=bar\n\n');
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('handles values containing equals signs', () => {
    const result = parseDotenv('URL=http://example.com?a=1&b=2');
    expect(result.URL).toBe('http://example.com?a=1&b=2');
  });

  it('returns empty object for empty string', () => {
    expect(parseDotenv('')).toEqual({});
  });

  it('skips lines without equals sign', () => {
    const result = parseDotenv('INVALID_LINE\nFOO=bar');
    expect(Object.keys(result)).toEqual(['FOO']);
  });
});
