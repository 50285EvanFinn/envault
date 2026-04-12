import { readVault, writeVault, vaultExists, ensureVaultDir } from '../storage/vaultFile';
import { encrypt, decrypt } from '../crypto/vault';
import { createEntry, updateEntry, createEmptyVault } from './envEntry';
import type { VaultData, EnvEntry } from './index';

export class EnvManager {
  private vault: VaultData;
  private vaultPath: string;
  private password: string;

  constructor(vault: VaultData, vaultPath: string, password: string) {
    this.vault = vault;
    this.vaultPath = vaultPath;
    this.password = password;
  }

  get(key: string): string | undefined {
    const entry = this.vault.entries[key];
    return entry?.value;
  }

  set(key: string, value: string): void {
    const existing = this.vault.entries[key];
    if (existing) {
      this.vault.entries[key] = updateEntry(existing, value);
    } else {
      this.vault.entries[key] = createEntry(key, value);
    }
  }

  delete(key: string): boolean {
    if (!this.vault.entries[key]) return false;
    delete this.vault.entries[key];
    return true;
  }

  listKeys(): string[] {
    return Object.keys(this.vault.entries).sort();
  }

  has(key: string): boolean {
    return key in this.vault.entries;
  }

  async save(): Promise<void> {
    await ensureVaultDir(this.vaultPath);
    const serialized = JSON.stringify(this.vault);
    const encrypted = await encrypt(serialized, this.password);
    await writeVault(this.vaultPath, encrypted);
  }
}

export async function loadEnvManager(vaultPath: string, password: string): Promise<EnvManager> {
  let vault: VaultData;

  if (await vaultExists(vaultPath)) {
    const encrypted = await readVault(vaultPath);
    const decrypted = await decrypt(encrypted, password);
    vault = JSON.parse(decrypted) as VaultData;
  } else {
    vault = createEmptyVault();
  }

  return new EnvManager(vault, vaultPath, password);
}
