import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import {
  createEmptyWebhookStore,
  addWebhook,
  removeWebhook,
  listWebhooks,
  updateWebhookEvents,
  WebhookEvent,
} from '../../env/envWebhook';
import { randomUUID } from 'crypto';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerWebhookCommand(program: Command): void {
  const webhook = program.command('webhook').description('Manage event webhooks');

  webhook
    .command('add <url>')
    .description('Register a webhook URL')
    .option('-e, --events <events>', 'Comma-separated events: set,delete,rotate,import', 'set')
    .action(async (url: string, opts: { events: string }) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.webhooks ?? createEmptyWebhookStore();
      const events = opts.events.split(',').map((e) => e.trim()) as WebhookEvent[];
      const id = randomUUID();
      const updated = addWebhook(store, id, url, events);
      payload.webhooks = updated;
      const { data, iv, salt } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ ...raw, data, iv, salt });
      console.log(`Webhook registered with id: ${id}`);
    });

  webhook
    .command('remove <id>')
    .description('Remove a webhook by id')
    .action(async (id: string) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.webhooks ?? createEmptyWebhookStore();
      payload.webhooks = removeWebhook(store, id);
      const { data, iv, salt } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ ...raw, data, iv, salt });
      console.log(`Webhook ${id} removed.`);
    });

  webhook
    .command('list')
    .description('List all registered webhooks')
    .action(async () => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.webhooks ?? createEmptyWebhookStore();
      const hooks = listWebhooks(store);
      if (hooks.length === 0) {
        console.log('No webhooks registered.');
      } else {
        hooks.forEach((h) => console.log(`[${h.id}] ${h.url} (${h.events.join(', ')})`));
      }
    });

  webhook
    .command('update <id>')
    .description('Update events for a webhook')
    .requiredOption('-e, --events <events>', 'Comma-separated events')
    .action(async (id: string, opts: { events: string }) => {
      const password = await promptPassword('Vault password: ');
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.webhooks ?? createEmptyWebhookStore();
      const events = opts.events.split(',').map((e) => e.trim()) as WebhookEvent[];
      payload.webhooks = updateWebhookEvents(store, id, events);
      const { data, iv, salt } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ ...raw, data, iv, salt });
      console.log(`Webhook ${id} updated.`);
    });
}
