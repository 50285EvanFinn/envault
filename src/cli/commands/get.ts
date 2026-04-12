import { Command } from 'commander';
import { readVault, vaultExists } from '../../storage/vaultFile';
import { decrypt } from '../../crypto/vault';
import { getEntry } from '../../env/envManager';

export function registerGetCommand(program: Command): void {
  program
    .command('get <key>')
    .description('Retrieve and decrypt an environment variable from the vault')
    .option('-p, --password <password>', 'Master password for decryption')
    .option('--export', 'Output in export format (export KEY=VALUE)')
    .action(async (key: string, options: { password?: string; export?: boolean }) => {
      try {
        if (!vaultExists()) {
          console.error('No vault found. Use `envault set` to create one.');
          process.exit(1);
        }

        const password = options.password ?? process.env.ENVAULT_PASSWORD;
        if (!password) {
          console.error('Password is required. Use --password or set ENVAULT_PASSWORD env var.');
          process.exit(1);
        }

        const encryptedVault = readVault();
        const decryptedJson = await decrypt(encryptedVault.data, password);
        const vault = JSON.parse(decryptedJson);

        const entry = getEntry(vault, key);
        if (!entry) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        if (options.export) {
          console.log(`export ${key}=${entry.value}`);
        } else {
          console.log(entry.value);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error retrieving key: ${error.message}`);
        } else {
          console.error('An unexpected error occurred.');
        }
        process.exit(1);
      }
    });
}
