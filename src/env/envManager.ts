import { encrypt, decrypt, deriveKey } from '../crypto/vault';
import { readVault, writeVault, vaultExists } from '../storage/vaultFile';
import {
  EnvVault,
  EnvEntry,
  createEntry,
  updateEntry,
  createEmptyVault,
} from './envEntry';

async function loadVault(password: string): Promise<EnvVault> {
  if (!(await vaultExists())) {
    return createEmptyVault();
  }
  const { ciphertext, salt, iv } = await readVault();
  const key = await deriveKey(password, salt);
  const plaintext = await decrypt(ciphertext, key, iv);
  return JSON.parse(plaintext) as EnvVault;
}

async function saveVault(vault: EnvVault, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  const { ciphertext, iv } = await encrypt(JSON.stringify(vault), key);
  await writeVault({ ciphertext, salt, iv });
}

export async function setEnv(
  key: string,
  value: string,
  password: string
): Promise<void> {
  const vault = await loadVault(password);
  const existing = vault.entries[key];
  vault.entries[key] = existing
    ? updateEntry(existing, value)
    : createEntry(key, value);
  await saveVault(vault, password);
}

export async function getEnv(
  key: string,
  password: string
): Promise<string | undefined> {
  const vault = await loadVault(password);
  return vault.entries[key]?.value;
}

export async function deleteEnv(key: string, password: string): Promise<boolean> {
  const vault = await loadVault(password);
  if (!vault.entries[key]) return false;
  delete vault.entries[key];
  await saveVault(vault, password);
  return true;
}

export async function listEnv(
  password: string
): Promise<Record<string, EnvEntry>> {
  const vault = await loadVault(password);
  return vault.entries;
}
