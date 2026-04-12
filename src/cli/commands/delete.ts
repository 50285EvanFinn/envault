import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, vaultExists } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { removeEntry } from '../../env/envManager';

function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete <key>')
    .description('Delete an environment variable from the vault')
    .option('-p, --password <password>', 'vault password')
    .option('-f, --force', 'skip confirmation prompt')
    .action(async (key: string, options: { password?: string; force?: boolean }) => {
      try {
        if (!vaultExists()) {
          console.error('No vault found. Use `envault set` to create one.');
          process.exit(1);
        }

        const password = options.password ?? process.env.ENVAULT_PASSWORD;
        if (!password) {
          console.error('Password is required. Use --password or set ENVAULT_PASSWORD.');
          process.exit(1);
        }

        const encrypted = readVault();
        const decrypted = await decrypt(encrypted, password);
        const vault = JSON.parse(decrypted);

        if (!vault.entries || !vault.entries[key]) {
          console.error(`Key "${key}" not found in vault.`);
          process.exit(1);
        }

        if (!options.force) {
          const confirmed = await promptConfirm(`Are you sure you want to delete "${key}"? (y/N): `);
          if (!confirmed) {
            console.log('Aborted.');
            process.exit(0);
          }
        }

        const updatedVault = removeEntry(vault, key);
        const updatedJson = JSON.stringify(updatedVault);
        const newEncrypted = await encrypt(updatedJson, password);
        writeVault(newEncrypted);

        console.log(`Deleted "${key}" from vault.`);
      } catch (err) {
        console.error('Failed to delete entry:', (err as Error).message);
        process.exit(1);
      }
    });
}
