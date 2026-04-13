import { Command } from 'commander';
import { readVault, vaultExists } from '../../storage/vaultFile';
import { decrypt } from '../../crypto/vault';
import { listEntries } from '../../env/envManager';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <pattern>')
    .description('Search for environment variable keys matching a pattern')
    .option('-p, --password <password>', 'vault password')
    .option('--show-values', 'reveal decrypted values in output')
    .action(async (pattern: string, options: { password?: string; showValues?: boolean }) => {
      try {
        if (!vaultExists()) {
          console.error('No vault found. Run `envault init` to create one.');
          process.exit(1);
        }

        const password = options.password;
        if (!password) {
          console.error('Password is required. Use --password <password>');
          process.exit(1);
        }

        const vault = readVault();
        const decryptedData = await decrypt(vault.data, password, vault.salt, vault.iv);
        const parsed = JSON.parse(decryptedData);
        const entries = listEntries(parsed);

        const regex = new RegExp(pattern, 'i');
        const matches = entries.filter((key) => regex.test(key));

        if (matches.length === 0) {
          console.log(`No keys matching "${pattern}" found.`);
          return;
        }

        console.log(`Found ${matches.length} match(es) for "${pattern}":`);
        for (const key of matches) {
          if (options.showValues) {
            const entry = parsed[key];
            console.log(`  ${key}=${entry?.value ?? ''}`);
          } else {
            console.log(`  ${key}`);
          }
        }
      } catch (err) {
        console.error('Search failed:', (err as Error).message);
        process.exit(1);
      }
    });
}
