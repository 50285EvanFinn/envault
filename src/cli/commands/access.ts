import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt, deriveKey } from '../../crypto/vault';
import {
  createEmptyAccessStore,
  setAccessRule,
  removeAccessRule,
  getAccessRule,
  listAccessRules,
} from '../../env/envAccess';

function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerAccessCommand(program: Command): void {
  const access = program.command('access').description('Manage per-key machine access rules');

  access
    .command('set <key>')
    .description('Set access rule for a key')
    .option('--allow <machines>', 'Comma-separated allowed machine IDs')
    .option('--deny <machines>', 'Comma-separated denied machine IDs')
    .action(async (key: string, opts) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const salt = Buffer.from(raw.salt, 'hex');
      const encKey = await deriveKey(password, salt);
      const payload = JSON.parse(await decrypt(raw.data, encKey));
      const store = payload.access ?? createEmptyAccessStore();
      const allowed = opts.allow ? opts.allow.split(',').map((s: string) => s.trim()) : [];
      const denied = opts.deny ? opts.deny.split(',').map((s: string) => s.trim()) : [];
      const updated = setAccessRule(store, key, allowed, denied);
      payload.access = updated;
      raw.data = await encrypt(JSON.stringify(payload), encKey);
      await writeVault(raw);
      console.log(`Access rule set for "${key}".`);
    });

  access
    .command('remove <key>')
    .description('Remove access rule for a key')
    .action(async (key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const salt = Buffer.from(raw.salt, 'hex');
      const encKey = await deriveKey(password, salt);
      const payload = JSON.parse(await decrypt(raw.data, encKey));
      const store = payload.access ?? createEmptyAccessStore();
      payload.access = removeAccessRule(store, key);
      raw.data = await encrypt(JSON.stringify(payload), encKey);
      await writeVault(raw);
      console.log(`Access rule removed for "${key}".`);
    });

  access
    .command('get <key>')
    .description('Show access rule for a key')
    .action(async (key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const salt = Buffer.from(raw.salt, 'hex');
      const encKey = await deriveKey(password, salt);
      const payload = JSON.parse(await decrypt(raw.data, encKey));
      const store = payload.access ?? createEmptyAccessStore();
      const rule = getAccessRule(store, key);
      if (!rule) { console.log(`No access rule for "${key}".`); return; }
      console.log(`Key: ${key}`);
      console.log(`  Allowed: ${rule.allowedMachines.join(', ') || '(all)'}`);
      console.log(`  Denied:  ${rule.deniedMachines.join(', ') || '(none)'}`);
    });

  access
    .command('list')
    .description('List all access rules')
    .action(async () => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const salt = Buffer.from(raw.salt, 'hex');
      const encKey = await deriveKey(password, salt);
      const payload = JSON.parse(await decrypt(raw.data, encKey));
      const store = payload.access ?? createEmptyAccessStore();
      const rules = listAccessRules(store);
      if (rules.length === 0) { console.log('No access rules defined.'); return; }
      rules.forEach((r) => {
        console.log(`${r.key}: allow=[${r.allowedMachines.join(',')}] deny=[${r.deniedMachines.join(',')}]`);
      });
    });
}
