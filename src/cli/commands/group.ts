import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import {
  createEmptyGroupStore,
  createGroup,
  removeGroup,
  addKeyToGroup,
  removeKeyFromGroup,
  getKeysInGroup,
  listAllGroups,
  findGroupsForKey,
} from '../../env/envGroup';

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

export function registerGroupCommand(program: Command): void {
  const group = program.command('group').description('Manage key groups');

  group
    .command('create <groupName>')
    .description('Create a new group')
    .action(async (groupName: string) => {
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.groups ?? createEmptyGroupStore();
      payload.groups = createGroup(store, groupName);
      const { data, iv, salt } = encrypt(JSON.stringify(payload), password);
      writeVault({ data, iv, salt });
      console.log(`Group "${groupName}" created.`);
    });

  group
    .command('delete <groupName>')
    .description('Delete a group')
    .action(async (groupName: string) => {
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.groups ?? createEmptyGroupStore();
      payload.groups = removeGroup(store, groupName);
      const { data, iv, salt } = encrypt(JSON.stringify(payload), password);
      writeVault({ data, iv, salt });
      console.log(`Group "${groupName}" deleted.`);
    });

  group
    .command('add <groupName> <key>')
    .description('Add a key to a group')
    .action(async (groupName: string, key: string) => {
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.groups ?? createEmptyGroupStore();
      payload.groups = addKeyToGroup(store, groupName, key);
      const { data, iv, salt } = encrypt(JSON.stringify(payload), password);
      writeVault({ data, iv, salt });
      console.log(`Key "${key}" added to group "${groupName}".`);
    });

  group
    .command('remove <groupName> <key>')
    .description('Remove a key from a group')
    .action(async (groupName: string, key: string) => {
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.groups ?? createEmptyGroupStore();
      payload.groups = removeKeyFromGroup(store, groupName, key);
      const { data, iv, salt } = encrypt(JSON.stringify(payload), password);
      writeVault({ data, iv, salt });
      console.log(`Key "${key}" removed from group "${groupName}".`);
    });

  group
    .command('list [groupName]')
    .description('List groups or keys in a group')
    .action(async (groupName?: string) => {
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.groups ?? createEmptyGroupStore();
      if (groupName) {
        const keys = getKeysInGroup(store, groupName);
        keys.length ? keys.forEach((k) => console.log(k)) : console.log('No keys in group.');
      } else {
        const groups = listAllGroups(store);
        groups.length ? groups.forEach((g) => console.log(g)) : console.log('No groups defined.');
      }
    });

  group
    .command('find <key>')
    .description('Find all groups containing a key')
    .action(async (key: string) => {
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const payload = JSON.parse(decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.groups ?? createEmptyGroupStore();
      const groups = findGroupsForKey(store, key);
      groups.length ? groups.forEach((g) => console.log(g)) : console.log('Key not found in any group.');
    });
}
