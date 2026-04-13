import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import {
  createEmptyProfileStore,
  createProfile,
  addProfile,
  removeProfile,
  addKeyToProfile,
  removeKeyFromProfile,
  listProfiles,
  getProfile,
} from '../../env/envProfile';

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

export function registerProfileCommand(program: Command): void {
  const profile = program.command('profile').description('Manage env profiles');

  profile
    .command('create <name>')
    .description('Create a new profile')
    .option('-d, --description <desc>', 'Profile description')
    .action(async (name: string, opts: { description?: string }) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.iv, raw.salt);
      const vault = JSON.parse(payload);
      const store = vault.profiles ? vault.profiles : createEmptyProfileStore();
      if (store.profiles[name]) { console.error(`Profile "${name}" already exists.`); process.exit(1); }
      const updated = addProfile(store, createProfile(name, [], opts.description));
      vault.profiles = updated;
      const { encrypted, iv, salt } = await encrypt(JSON.stringify(vault), password);
      await writeVault({ data: encrypted, iv, salt });
      console.log(`Profile "${name}" created.`);
    });

  profile
    .command('delete <name>')
    .description('Delete a profile')
    .action(async (name: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.iv, raw.salt);
      const vault = JSON.parse(payload);
      const store = vault.profiles ?? createEmptyProfileStore();
      vault.profiles = removeProfile(store, name);
      const { encrypted, iv, salt } = await encrypt(JSON.stringify(vault), password);
      await writeVault({ data: encrypted, iv, salt });
      console.log(`Profile "${name}" deleted.`);
    });

  profile
    .command('add-key <profileName> <key>')
    .description('Add a key to a profile')
    .action(async (profileName: string, key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.iv, raw.salt);
      const vault = JSON.parse(payload);
      const store = vault.profiles ?? createEmptyProfileStore();
      if (!getProfile(store, profileName)) { console.error(`Profile "${profileName}" not found.`); process.exit(1); }
      vault.profiles = addKeyToProfile(store, profileName, key);
      const { encrypted, iv, salt } = await encrypt(JSON.stringify(vault), password);
      await writeVault({ data: encrypted, iv, salt });
      console.log(`Key "${key}" added to profile "${profileName}".`);
    });

  profile
    .command('remove-key <profileName> <key>')
    .description('Remove a key from a profile')
    .action(async (profileName: string, key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.iv, raw.salt);
      const vault = JSON.parse(payload);
      const store = vault.profiles ?? createEmptyProfileStore();
      vault.profiles = removeKeyFromProfile(store, profileName, key);
      const { encrypted, iv, salt } = await encrypt(JSON.stringify(vault), password);
      await writeVault({ data: encrypted, iv, salt });
      console.log(`Key "${key}" removed from profile "${profileName}".`);
    });

  profile
    .command('list')
    .description('List all profiles')
    .action(async () => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.iv, raw.salt);
      const vault = JSON.parse(payload);
      const store = vault.profiles ?? createEmptyProfileStore();
      const profiles = listProfiles(store);
      if (profiles.length === 0) { console.log('No profiles found.'); return; }
      profiles.forEach((p) => {
        console.log(`${p.name}${p.description ? ` — ${p.description}` : ''} (${p.keys.length} keys)`);
      });
    });
}
