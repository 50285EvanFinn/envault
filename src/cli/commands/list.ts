import { Command } from 'commander';
import { loadEnvManager } from '../../env';
import { getVaultPath } from '../../storage/vaultFile';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .alias('ls')
    .description('List all environment variable keys in the vault')
    .option('-v, --vault <path>', 'path to vault file')
    .option('--show-values', 'also display values (use with caution)')
    .action(async (options) => {
      try {
        const vaultPath = options.vault ?? getVaultPath();
        const password = process.env.ENVAULT_PASSWORD;

        if (!password) {
          console.error('Error: ENVAULT_PASSWORD environment variable is not set.');
          process.exit(1);
        }

        const manager = await loadEnvManager(vaultPath, password);
        const keys = manager.listKeys();

        if (keys.length === 0) {
          console.log('No environment variables stored in vault.');
          return;
        }

        console.log(`Found ${keys.length} variable(s):\n`);

        if (options.showValues) {
          for (const key of keys) {
            const value = manager.get(key);
            console.log(`  ${key}=${value}`);
          }
        } else {
          for (const key of keys) {
            console.log(`  ${key}`);
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
