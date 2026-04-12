import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { vaultExists, readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { loadEnvEntries, saveEnvEntries } from '../../env';

export function parseDotenv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}

export function registerImportCommand(program: Command): void {
  program
    .command('import <file>')
    .description('Import environment variables from a .env or JSON file')
    .requiredOption('-p, --password <password>', 'Vault password')
    .option('--overwrite', 'Overwrite existing keys', false)
    .action(async (file: string, options) => {
      try {
        if (!vaultExists()) {
          console.error('No vault found. Run `envault init` first.');
          process.exit(1);
        }

        const filePath = path.resolve(file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const ext = path.extname(file).toLowerCase();
        const incoming: Record<string, string> =
          ext === '.json' ? JSON.parse(raw) : parseDotenv(raw);

        const vault = await readVault();
        const decrypted = await decrypt(vault.encrypted, options.password, vault.iv, vault.salt);
        const existing = loadEnvEntries(decrypted);

        let imported = 0;
        for (const [key, value] of Object.entries(incoming)) {
          if (!options.overwrite && key in existing) continue;
          existing[key] = value;
          imported++;
        }

        const newPlaintext = saveEnvEntries(existing);
        const { encrypted, iv } = await encrypt(newPlaintext, options.password, vault.salt);
        await writeVault({ ...vault, encrypted, iv });

        console.log(`Imported ${imported} variable(s).`);
      } catch (err: any) {
        console.error('Import failed:', err.message);
        process.exit(1);
      }
    });
}
