import fs from 'fs';
import path from 'path';
import os from 'os';

export interface VaultData {
  version: number;
  iv: string;
  salt: string;
  ciphertext: string;
  createdAt: string;
  updatedAt: string;
}

const VAULT_DIR = path.join(os.homedir(), '.envault');
const VAULT_FILE = path.join(VAULT_DIR, 'vault.json');

export function getVaultPath(): string {
  return VAULT_FILE;
}

export function vaultExists(): boolean {
  return fs.existsSync(VAULT_FILE);
}

export function ensureVaultDir(): void {
  if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR, { recursive: true, mode: 0o700 });
  }
}

export function readVault(): VaultData {
  if (!vaultExists()) {
    throw new Error('Vault does not exist. Run `envault init` to create one.');
  }
  const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
  return JSON.parse(raw) as VaultData;
}

export function writeVault(data: VaultData): void {
  ensureVaultDir();
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(VAULT_FILE, json, { encoding: 'utf-8', mode: 0o600 });
}

export function deleteVault(): void {
  if (vaultExists()) {
    fs.unlinkSync(VAULT_FILE);
  }
}
