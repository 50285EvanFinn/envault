import { Command } from 'commander';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { lockKey, unlockKey, isLocked, listLockedKeys, createEmptyLockStore } from '../../env/envLock';
import * as readline from 'readline';

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerLockCommand(program: Command): void {
  const lock = program.command('lock').description('Lock or inspect locked env keys');

  lock
    .command('add <key>')
    .description('Lock a key to prevent modification')
    .option('-r, --reason <reason>', 'Reason for locking')
    .action(async (key: string, opts: { reason?: string }) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      payload.locks = lockKey(payload.locks ?? createEmptyLockStore(), key, opts.reason);
      const { data, iv, salt } = encrypt(JSON.stringify(payload), password);
      await writeVault({ data, iv, salt });
      console.log(`🔒 Locked key: ${key}`);
    });

  lock
    .command('remove <key>')
    .description('Unlock a key')
    .action(async (key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      if (!isLocked(payload.locks ?? createEmptyLockStore(), key)) {
        console.log(`Key "${key}" is not locked.`);
        return;
      }
      payload.locks = unlockKey(payload.locks, key);
      const { data, iv, salt } = encrypt(JSON.stringify(payload), password);
      await writeVault({ data, iv, salt });
      console.log(`🔓 Unlocked key: ${key}`);
    });

  lock
    .command('list')
    .description('List all locked keys')
    .action(async () => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.locks ?? createEmptyLockStore();
      const keys = listLockedKeys(store);
      if (keys.length === 0) { console.log('No locked keys.'); return; }
      keys.forEach((k) => {
        const rec = store.lockedKeys[k];
        const reason = rec.reason ? ` — ${rec.reason}` : '';
        console.log(`  🔒 ${k}${reason} (since ${rec.lockedAt})`);
      });
    });
}
