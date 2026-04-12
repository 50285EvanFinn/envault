import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setEnv, getEnv, deleteEnv, listEnv } from './envManager';
import * as vaultFile from '../storage/vaultFile';
import * as vaultCrypto from '../crypto/vault';

vi.mock('../storage/vaultFile');
vi.mock('../crypto/vault');

const mockPassword = 'test-password';
const mockSalt = new Uint8Array(16);
const mockIv = new Uint8Array(12);
const mockKey = {} as CryptoKey;

let storedVaultData: { ciphertext: Uint8Array; salt: Uint8Array; iv: Uint8Array } | null = null;
let inMemoryVaultJson = JSON.stringify({ version: 1, entries: {} });

beforeEach(() => {
  storedVaultData = null;
  inMemoryVaultJson = JSON.stringify({ version: 1, entries: {} });

  vi.mocked(vaultFile.vaultExists).mockResolvedValue(storedVaultData !== null);
  vi.mocked(vaultFile.readVault).mockResolvedValue({
    ciphertext: new Uint8Array(),
    salt: mockSalt,
    iv: mockIv,
  });
  vi.mocked(vaultFile.writeVault).mockImplementation(async (data) => {
    storedVaultData = data;
  });
  vi.mocked(vaultCrypto.deriveKey).mockResolvedValue(mockKey);
  vi.mocked(vaultCrypto.encrypt).mockImplementation(async (plaintext) => {
    inMemoryVaultJson = plaintext;
    return { ciphertext: new Uint8Array(), iv: mockIv };
  });
  vi.mocked(vaultCrypto.decrypt).mockImplementation(async () => inMemoryVaultJson);
});

describe('envManager', () => {
  it('sets and gets an env variable', async () => {
    await setEnv('API_KEY', 'secret123', mockPassword);
    vi.mocked(vaultFile.vaultExists).mockResolvedValue(true);
    const value = await getEnv('API_KEY', mockPassword);
    expect(value).toBe('secret123');
  });

  it('returns undefined for missing key', async () => {
    const value = await getEnv('MISSING_KEY', mockPassword);
    expect(value).toBeUndefined();
  });

  it('updates an existing key', async () => {
    await setEnv('DB_URL', 'old-url', mockPassword);
    vi.mocked(vaultFile.vaultExists).mockResolvedValue(true);
    await setEnv('DB_URL', 'new-url', mockPassword);
    vi.mocked(vaultFile.vaultExists).mockResolvedValue(true);
    const value = await getEnv('DB_URL', mockPassword);
    expect(value).toBe('new-url');
  });

  it('deletes an existing key', async () => {
    await setEnv('TOKEN', 'abc', mockPassword);
    vi.mocked(vaultFile.vaultExists).mockResolvedValue(true);
    const deleted = await deleteEnv('TOKEN', mockPassword);
    expect(deleted).toBe(true);
  });

  it('returns false when deleting non-existent key', async () => {
    const deleted = await deleteEnv('NOPE', mockPassword);
    expect(deleted).toBe(false);
  });

  it('lists all env entries', async () => {
    await setEnv('FOO', 'bar', mockPassword);
    vi.mocked(vaultFile.vaultExists).mockResolvedValue(true);
    const entries = await listEnv(mockPassword);
    expect(Object.keys(entries)).toContain('FOO');
  });
});
