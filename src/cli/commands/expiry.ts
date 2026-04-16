import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { setExpiry, removeExpiry, getExpiry, isExpired, listExpiredKeys } from '../../env/envExpiry';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerExpiryCommand(program: Command): void {
  const expiry = program.command('expiry').description('Manage key expiry');

  expiry
    .command('set <key> <date>')
    .description('Set expiry date for a key (ISO format)')
    .action(async (key: string, date: string) => {
      try {
        const password = await promptPassword('Password: ');
        const raw = await readVault();
        const payload = await decrypt(raw.data, password);
        const expiresAt = new Date(date);
        if (isNaN(expiresAt.getTime())) throw new Error('Invalid date format');
        payload.expiry = setExpiry(payload.expiry ?? {}, key, expiresAt);
        const encrypted = await encrypt(payload, password);
        await writeVault({ ...raw, data: encrypted });
        console.log(`Expiry set for "${key}": ${expiresAt.toISOString()}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  expiry
    .command('remove <key>')
    .description('Remove expiry for a key')
    .action(async (key: string) => {
      try {
        const password = await promptPassword('Password: ');
        const raw = await readVault();
        const payload = await decrypt(raw.data, password);
        payload.expiry = removeExpiry(payload.expiry ?? {}, key);
        const encrypted = await encrypt(payload, password);
        await writeVault({ ...raw, data: encrypted });
        console.log(`Expiry removed for "${key}"`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  expiry
    .command('check <key>')
    .description('Check expiry status of a key')
    .action(async (key: string) => {
      try {
        const password = await promptPassword('Password: ');
        const raw = await readVault();
        const payload = await decrypt(raw.data, password);
        const record = getExpiry(payload.expiry ?? {}, key);
        if (!record) { console.log(`No expiry set for "${key}"`); return; }
        const expired = isExpired(payload.expiry ?? {}, key);
        console.log(`Key: ${key}\nExpires: ${record.expiresAt}\nStatus: ${expired ? 'EXPIRED' : 'valid'}`);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });

  expiry
    .command('list-expired')
    .description('List all expired keys')
    .action(async () => {
      try {
        const password = await promptPassword('Password: ');
        const raw = await readVault();
        const payload = await decrypt(raw.data, password);
        const keys = listExpiredKeys(payload.expiry ?? {});
        if (keys.length === 0) { console.log('No expired keys.'); return; }
        console.log('Expired keys:\n' + keys.map(k => `  - ${k}`).join('\n'));
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
