import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import {
  createEmptyTemplateStore,
  createTemplate,
  addTemplate,
  removeTemplate,
  getTemplate,
  listTemplates,
  validateAgainstTemplate,
  TemplateVariable,
} from '../../env/envTemplate';
import { listEntries } from '../../env/envManager';

export async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerTemplateCommand(program: Command): void {
  const template = program.command('template').description('Manage env templates');

  template
    .command('create <name>')
    .description('Create a new template from current vault keys')
    .option('--required <keys>', 'comma-separated required keys')
    .option('--desc <description>', 'template description')
    .action(async (name, opts) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.salt, raw.iv);
      const vault = JSON.parse(payload);
      const requiredKeys = opts.required ? opts.required.split(',').map((k: string) => k.trim()) : [];
      const entries = listEntries(vault);
      const variables: TemplateVariable[] = entries.map((e) => ({
        key: e.key,
        required: requiredKeys.includes(e.key),
        description: undefined,
      }));
      const t = createTemplate(name, variables, opts.desc);
      const store = addTemplate(vault.templates ?? createEmptyTemplateStore(), t);
      const updated = { ...vault, templates: store };
      const { data, salt, iv } = await encrypt(JSON.stringify(updated), password);
      await writeVault({ ...raw, data, salt, iv });
      console.log(`Template '${name}' created with ${variables.length} variable(s).`);
    });

  template
    .command('list')
    .description('List all templates')
    .action(async () => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.salt, raw.iv);
      const vault = JSON.parse(payload);
      const store = vault.templates ?? createEmptyTemplateStore();
      const templates = listTemplates(store);
      if (templates.length === 0) { console.log('No templates found.'); return; }
      templates.forEach((t) => {
        console.log(`${t.name} (${t.variables.length} vars)${t.description ? ' — ' + t.description : ''}`);
      });
    });

  template
    .command('show <name>')
    .description('Show template details')
    .action(async (name) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.salt, raw.iv);
      const vault = JSON.parse(payload);
      const store = vault.templates ?? createEmptyTemplateStore();
      const t = getTemplate(store, name);
      if (!t) { console.error(`Template '${name}' not found.`); process.exit(1); }
      console.log(`Name: ${t.name}`);
      if (t.description) console.log(`Description: ${t.description}`);
      t.variables.forEach((v) => {
        const parts = [`  ${v.key}`, v.required ? '[required]' : '[optional]'];
        if (v.defaultValue !== undefined) parts.push(`default=${v.defaultValue}`);
        console.log(parts.join(' '));
      });
    });

  template
    .command('validate <name>')
    .description('Validate current vault entries against a template')
    .action(async (name) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.salt, raw.iv);
      const vault = JSON.parse(payload);
      const store = vault.templates ?? createEmptyTemplateStore();
      const t = getTemplate(store, name);
      if (!t) { console.error(`Template '${name}' not found.`); process.exit(1); }
      const entries = listEntries(vault);
      const entryMap: Record<string, string> = {};
      entries.forEach((e) => { entryMap[e.key] = e.value; });
      const missing = validateAgainstTemplate(t, entryMap);
      if (missing.length === 0) { console.log('All required variables are present.'); }
      else { console.error(`Missing required variables: ${missing.join(', ')}`); process.exit(1); }
    });

  template
    .command('delete <name>')
    .description('Delete a template')
    .action(async (name) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = await decrypt(raw.data, password, raw.salt, raw.iv);
      const vault = JSON.parse(payload);
      const store = vault.templates ?? createEmptyTemplateStore();
      if (!getTemplate(store, name)) { console.error(`Template '${name}' not found.`); process.exit(1); }
      const updated = { ...vault, templates: removeTemplate(store, name) };
      const { data, salt, iv } = await encrypt(JSON.stringify(updated), password);
      await writeVault({ ...raw, data, salt, iv });
      console.log(`Template '${name}' deleted.`);
    });
}
