import { encrypt, decrypt, EncryptedPayload } from './vault';

const TEST_PASSWORD = 'super-secret-password-123';
const TEST_PLAINTEXT = JSON.stringify({ API_KEY: 'abc123', DB_URL: 'postgres://localhost/dev' });

describe('vault encryption', () => {
  it('encrypts plaintext and returns a structured payload', () => {
    const payload = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);

    expect(payload).toHaveProperty('salt');
    expect(payload).toHaveProperty('iv');
    expect(payload).toHaveProperty('tag');
    expect(payload).toHaveProperty('data');
    expect(typeof payload.salt).toBe('string');
    expect(payload.data).not.toBe(TEST_PLAINTEXT);
  });

  it('decrypts an encrypted payload back to the original plaintext', () => {
    const payload = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    const result = decrypt(payload, TEST_PASSWORD);

    expect(result).toBe(TEST_PLAINTEXT);
  });

  it('produces different ciphertext on each encryption (random IV/salt)', () => {
    const payload1 = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    const payload2 = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);

    expect(payload1.data).not.toBe(payload2.data);
    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.salt).not.toBe(payload2.salt);
  });

  it('throws when decrypting with a wrong password', () => {
    const payload = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);

    expect(() => decrypt(payload, 'wrong-password')).toThrow(
      'Decryption failed: invalid password or corrupted data'
    );
  });

  it('throws when the payload data is tampered with', () => {
    const payload = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    const tampered: EncryptedPayload = { ...payload, data: payload.data.replace(/a/g, 'b') };

    expect(() => decrypt(tampered, TEST_PASSWORD)).toThrow();
  });

  it('throws when the auth tag is tampered with', () => {
    const payload = encrypt(TEST_PLAINTEXT, TEST_PASSWORD);
    const tampered: EncryptedPayload = { ...payload, tag: payload.tag.replace(/f/g, '0') };

    expect(() => decrypt(tampered, TEST_PASSWORD)).toThrow();
  });
});
