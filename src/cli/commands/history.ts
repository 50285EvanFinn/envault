import { Command } from 'commander';
import { readVault } from '../../storage/vaultFile';
import { promptPassword } from './init';
import { decrypt } from '../../crypto/vault';
import {
  filterHistoryByKey,
  filterHistoryByAction,
  HistoryRecord,
} from '../../env/envHistory';

function formatRecord(record: HistoryRecord): string {
  const date = new Date(record.timestamp).toLocaleString();
  const prev = record.previousValue !== undefined ? `"${record.previousValue}"` : 'N/A';
  const next = record.newValue !== undefined ? `"${record.newValue}"` : 'N/A';
  return `  [${date}] ${record.action.toUpperCase()} ${record.key}: ${prev} → ${next}`;
}

export function registerHistoryCommand(program: Command): void {
  program
    .command('history')
    .description('Show the change history of the vault')
    .option('-k, --key <key>', 'Filter history by key name')
    .option('-a, --action <action>', 'Filter by action (set, delete, rename, rotate)')
    .option('-n, --limit <number>', 'Limit number of records shown', '20')
    .action(async (options) => {
      try {
        const password = await promptPassword('Enter vault password: ');
        const encryptedVault = await readVault();
        const decrypted = await decrypt(encryptedVault, password);
        const vault = JSON.parse(decrypted);

        if (!vault.history || vault.history.records.length === 0) {
          console.log('No history records found.');
          return;
        }

        let records: HistoryRecord[] = vault.history.records;

        if (options.key) {
          records = filterHistoryByKey({ records }, options.key);
        }

        if (options.action) {
          records = filterHistoryByAction({ records }, options.action);
        }

        const limit = parseInt(options.limit, 10);
        records = records.slice(0, limit);

        if (records.length === 0) {
          console.log('No matching history records found.');
          return;
        }

        console.log(`\nVault History (${records.length} records):\n`);
        records.forEach((r) => console.log(formatRecord(r)));
        console.log();
      } catch (err: any) {
        console.error('Error reading history:', err.message);
        process.exit(1);
      }
    });
}
