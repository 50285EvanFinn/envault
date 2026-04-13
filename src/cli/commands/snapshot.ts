import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, getVaultPath } from '../../storage/vaultFile';
import { decrypt, encrypt, deriveKey } from '../../crypto/vault';
import {
  createSnapshot,
  addSnapshot,
  removeSnapshot,
  listSnapshots,
  getSnapshot,
  createEmptySnapshotStore,
  SnapshotStore,
} from '../../env/envSnapshot';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerSnapshotCommand(program: Command): void {
  const snap = program.command('snapshot').description('Manage vault snapshots');

  snap
    .command('save <label>')
    .description('Save the current vault state as a named snapshot')
    .action(async (label: string) => {
      const password = await promptPassword('Master password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const snapStore: SnapshotStore = payload.snapshots
        ? payload.snapshots
        : createEmptySnapshotStore();
      const newSnap = createSnapshot(payload, label);
      const updatedStore = addSnapshot(snapStore, newSnap);
      payload.snapshots = updatedStore;
      const encrypted = await encrypt(JSON.stringify(payload), key);
      writeVault({ ...raw, data: encrypted });
      console.log(`Snapshot "${label}" saved (${newSnap.id}).`);
    });

  snap
    .command('list')
    .description('List all saved snapshots')
    .action(async () => {
      const password = await promptPassword('Master password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const snapStore: SnapshotStore = payload.snapshots ?? createEmptySnapshotStore();
      const snaps = listSnapshots(snapStore);
      if (snaps.length === 0) {
        console.log('No snapshots found.');
        return;
      }
      snaps.forEach((s) => console.log(`${s.id}  [${s.createdAt}]  ${s.label}`));
    });

  snap
    .command('delete <id>')
    .description('Delete a snapshot by ID')
    .action(async (id: string) => {
      const password = await promptPassword('Master password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const snapStore: SnapshotStore = payload.snapshots ?? createEmptySnapshotStore();
      payload.snapshots = removeSnapshot(snapStore, id);
      const encrypted = await encrypt(JSON.stringify(payload), key);
      writeVault({ ...raw, data: encrypted });
      console.log(`Snapshot ${id} deleted.`);
    });

  snap
    .command('restore <id>')
    .description('Restore vault entries from a snapshot')
    .action(async (id: string) => {
      const password = await promptPassword('Master password: ');
      const raw = readVault();
      const key = await deriveKey(password, Buffer.from(raw.salt, 'hex'));
      const payload = JSON.parse(await decrypt(raw.data, key));
      const snapStore: SnapshotStore = payload.snapshots ?? createEmptySnapshotStore();
      const snap = getSnapshot(snapStore, id);
      if (!snap) {
        console.error(`Snapshot "${id}" not found.`);
        process.exit(1);
      }
      const restored: Record<string, { value: string; createdAt: string; updatedAt: string }> = {};
      for (const [k, v] of Object.entries(snap.entries)) {
        restored[k] = { value: v.value, createdAt: v.updatedAt, updatedAt: new Date().toISOString() };
      }
      payload.entries = restored;
      const encrypted = await encrypt(JSON.stringify(payload), key);
      writeVault({ ...raw, data: encrypted });
      console.log(`Vault restored from snapshot "${snap.label}".`);
    });
}
