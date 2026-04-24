import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, vaultExists } from '../../storage/vaultFile';
import { decrypt, deriveKey } from '../../crypto/vault';
import {
  createEmptyAuditStore,
  appendAuditRecord,
  createAuditRecord,
  filterAuditByKey,
  filterAuditByAction,
  getRecentAuditRecords,
  clearAuditStore,
  AuditAction,
} from '../../env/envAudit';

async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function formatRecord(r: { key: string; action: string; timestamp: string; success: boolean; metadata?: Record<string, string> }): string {
  const status = r.success ? '✓' : '✗';
  const meta = r.metadata ? ` [${Object.entries(r.metadata).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '';
  return `${r.timestamp}  ${status}  ${r.action.padEnd(8)}  ${r.key}${meta}`;
}

export function registerAuditCommand(program: Command): void {
  const audit = program.command('audit').description('View and manage the audit log');

  audit
    .command('log')
    .description('Show audit log entries')
    .option('-k, --key <key>', 'Filter by key name')
    .option('-a, --action <action>', 'Filter by action type')
    .option('-n, --limit <number>', 'Show last N entries', '20')
    .action(async (opts) => {
      if (!vaultExists()) return console.error('No vault found. Run `envault init` first.');
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = deriveKey(password, raw.salt);
      const payload = JSON.parse(decrypt(raw.data, key));
      const store = payload.audit ?? createEmptyAuditStore();
      const limit = parseInt(opts.limit, 10);

      let records = store.records;
      if (opts.key) records = filterAuditByKey({ records }, opts.key).records ?? filterAuditByKey({ records }, opts.key);
      if (opts.action) records = filterAuditByAction({ records }, opts.action as AuditAction);
      records = getRecentAuditRecords({ records }, limit);

      if (records.length === 0) return console.log('No audit records found.');
      console.log(`${'TIMESTAMP'.padEnd(25)}  S  ACTION    KEY`);
      console.log('-'.repeat(60));
      records.forEach((r) => console.log(formatRecord(r)));
    });

  audit
    .command('clear')
    .description('Clear all audit log entries')
    .action(async () => {
      if (!vaultExists()) return console.error('No vault found. Run `envault init` first.');
      const password = await promptPassword('Password: ');
      const raw = readVault();
      const key = deriveKey(password, raw.salt);
      const payload = JSON.parse(decrypt(raw.data, key));
      payload.audit = clearAuditStore();
      const { encrypt } = await import('../../crypto/vault');
      raw.data = encrypt(JSON.stringify(payload), key);
      writeVault(raw);
      console.log('Audit log cleared.');
    });
}
