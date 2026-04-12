import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnvEntries } from '../../env';
import { readVault } from '../../storage/vaultFile';
import { decrypt } from '../../crypto/vault';

export type ExportFormat = 'dotenv' | 'json';

export function formatAsDotenv(entries: Record<string, string>): string {
  return Object.entries(entries)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join('\n');
}

export function formatAsJson(entries: Record<string, string>): string {
  return JSON.stringify(entries, null, 2);
}

export function registerExportCommand(program: Command): void {
  program
    .command('export')
    .description('Export environment variables to a file or stdout')
    .option('-f, --format <format>', 'Output format: dotenv or json', 'dotenv')
    .option('-o, --output <file>', 'Output file path (defaults to stdout)')
    .requiredOption('-p, --password <password>', 'Vault password')
    .action(async (options) => {
      try {
        const vault = await readVault();
        const decrypted = await decrypt(vault.encrypted, options.password, vault.iv, vault.salt);
        const entries = loadEnvEntries(decrypted);

        const format: ExportFormat = options.format === 'json' ? 'json' : 'dotenv';
        const output =
          format === 'json'
            ? formatAsJson(entries)
            : formatAsDotenv(entries);

        if (options.output) {
          const filePath = path.resolve(options.output);
          fs.writeFileSync(filePath, output, 'utf-8');
          console.log(`Exported to ${filePath}`);
        } else {
          console.log(output);
        }
      } catch (err: any) {
        console.error('Export failed:', err.message);
        process.exit(1);
      }
    });
}
