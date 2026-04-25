import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import {
  createEmptyCommentStore,
  setComment,
  removeComment,
  getComment,
  listCommentedKeys,
} from '../../env/envComment';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerCommentCommand(program: Command): void {
  const comment = program.command('comment').description('Manage comments on env keys');

  comment
    .command('set <key> <text>')
    .description('Set a comment for an env key')
    .action(async (key: string, text: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, password, raw.iv, raw.salt));
      const store = payload.comments ?? createEmptyCommentStore();
      const updated = setComment(store, key, text);
      payload.comments = updated;
      const { iv, salt, data } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ iv, salt, data });
      console.log(`Comment set for "${key}".`);
    });

  comment
    .command('get <key>')
    .description('Get the comment for an env key')
    .action(async (key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, password, raw.iv, raw.salt));
      const store = payload.comments ?? createEmptyCommentStore();
      const text = getComment(store, key);
      if (text === undefined) {
        console.log(`No comment found for "${key}".`);
      } else {
        console.log(`${key}: ${text}`);
      }
    });

  comment
    .command('remove <key>')
    .description('Remove the comment for an env key')
    .action(async (key: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, password, raw.iv, raw.salt));
      const store = payload.comments ?? createEmptyCommentStore();
      const updated = removeComment(store, key);
      payload.comments = updated;
      const { iv, salt, data } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ iv, salt, data });
      console.log(`Comment removed for "${key}".`);
    });

  comment
    .command('list')
    .description('List all keys that have comments')
    .action(async () => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, password, raw.iv, raw.salt));
      const store = payload.comments ?? createEmptyCommentStore();
      const keys = listCommentedKeys(store);
      if (keys.length === 0) {
        console.log('No comments found.');
      } else {
        keys.forEach((k) => console.log(`${k}: ${store.comments[k]}`));
      }
    });
}
