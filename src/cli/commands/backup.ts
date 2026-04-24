import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, vaultExists } from '../../storage/vaultFile';
import { decrypt, encrypt, deriveKey } from '../../crypto/vault';
import {
  createBackup,
  addBackup,
  removeBackup,
  getBackup,
  listBackups,
  pruneBackups,
  createEmptyBackupStore,
} from '../../env/envBackup';

async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerBackupCommand(program: Command): void {
  const backup = program.command('backup').description('Manage vault backups');

  backup
    .command('create <label>')
    .description('Create a named backup of the current vault')
    .action(async (label: string) => {
      if (!vaultExists()) { console.error('No vault found. Run init first.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const store = payload.backups ?? createEmptyBackupStore();
      const record = createBackup(label, payload);
      payload.backups = addBackup(store, record);
      const newData = await encrypt(JSON.stringify(payload), key);
      writeVault({ ...raw, data: newData });
      console.log(`Backup "${label}" created (${record.id}).`);
    });

  backup
    .command('list')
    .description('List all backups')
    .action(async () => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const store = payload.backups ?? createEmptyBackupStore();
      const records = listBackups(store);
      if (records.length === 0) { console.log('No backups found.'); return; }
      records.forEach((r) => console.log(`${r.id}  [${r.label}]  ${r.createdAt}`));
    });

  backup
    .command('restore <id>')
    .description('Restore vault from a backup by ID')
    .action(async (id: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const store = payload.backups ?? createEmptyBackupStore();
      const record = getBackup(store, id);
      if (!record) { console.error(`Backup ${id} not found.`); process.exit(1); }
      const restored = { ...record.payload, backups: store };
      const newData = await encrypt(JSON.stringify(restored), key);
      writeVault({ ...raw, data: newData });
      console.log(`Vault restored from backup "${record.label}".`);
    });

  backup
    .command('delete <id>')
    .description('Delete a backup by ID')
    .action(async (id: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const store = payload.backups ?? createEmptyBackupStore();
      payload.backups = removeBackup(store, id);
      const newData = await encrypt(JSON.stringify(payload), key);
      writeVault({ ...raw, data: newData });
      console.log(`Backup ${id} deleted.`);
    });

  backup
    .command('prune <max>')
    .description('Keep only the <max> most recent backups')
    .action(async (max: string) => {
      if (!vaultExists()) { console.error('No vault found.'); process.exit(1); }
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const store = payload.backups ?? createEmptyBackupStore();
      payload.backups = pruneBackups(store, parseInt(max, 10));
      const newData = await encrypt(JSON.stringify(payload), key);
      writeVault({ ...raw, data: newData });
      console.log(`Backups pruned to ${max} most recent.`);
    });
}
