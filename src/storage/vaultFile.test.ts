import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getVaultPath,
  vaultExists,
  ensureVaultDir,
  readVault,
  writeVault,
  deleteVault,
  VaultData,
} from './vaultFile';

const VAULT_DIR = path.join(os.homedir(), '.envault');
const VAULT_FILE = path.join(VAULT_DIR, 'vault.json');

const mockVaultData: VaultData = {
  version: 1,
  iv: 'abc123iv',
  salt: 'abc123salt',
  ciphertext: 'encryptedpayload==',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

afterEach(() => {
  if (fs.existsSync(VAULT_FILE)) {
    fs.unlinkSync(VAULT_FILE);
  }
});

describe('vaultFile', () => {
  test('getVaultPath returns expected path', () => {
    expect(getVaultPath()).toBe(VAULT_FILE);
  });

  test('vaultExists returns false when vault is absent', () => {
    if (fs.existsSync(VAULT_FILE)) fs.unlinkSync(VAULT_FILE);
    expect(vaultExists()).toBe(false);
  });

  test('writeVault creates file and readVault returns correct data', () => {
    writeVault(mockVaultData);
    expect(vaultExists()).toBe(true);
    const data = readVault();
    expect(data.version).toBe(1);
    expect(data.iv).toBe('abc123iv');
    expect(data.ciphertext).toBe('encryptedpayload==');
  });

  test('readVault throws when vault does not exist', () => {
    if (fs.existsSync(VAULT_FILE)) fs.unlinkSync(VAULT_FILE);
    expect(() => readVault()).toThrow('Vault does not exist');
  });

  test('deleteVault removes the vault file', () => {
    writeVault(mockVaultData);
    deleteVault();
    expect(vaultExists()).toBe(false);
  });

  test('ensureVaultDir creates directory if missing', () => {
    ensureVaultDir();
    expect(fs.existsSync(VAULT_DIR)).toBe(true);
  });
});
