import { Command } from 'commander';
import * as path from 'path';
import * as readline from 'readline';
import { vaultExists, ensureVaultDir, writeVault } from '../../storage/vaultFile';
import { createEmptyVault } from '../../env';
import { encrypt } from '../../crypto/vault';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // Hide input for password
    const stdin = process.openStdin();
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (char: string) => {
      char = char + '';
      if (char === '\n' || char === '\r' || char === '\u0004') {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (char === '\u0003') {
        process.exit();
      } else {
        password += char;
        process.stdout.write('*');
      }
    });
  });
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize a new encrypted vault in the current directory')
    .option('-f, --force', 'Overwrite existing vault', false)
    .action(async (options: { force: boolean }) => {
      try {
        const vaultPath = path.join(process.cwd(), '.envault');

        if (vaultExists(vaultPath) && !options.force) {
          console.error(
            'Vault already exists. Use --force to overwrite.'
          );
          process.exit(1);
        }

        const password = await promptPassword('Enter master password: ');
        if (!password || password.trim().length === 0) {
          console.error('Password cannot be empty.');
          process.exit(1);
        }

        const confirm = await promptPassword('Confirm master password: ');
        if (password !== confirm) {
          console.error('Passwords do not match.');
          process.exit(1);
        }

        const emptyVault = createEmptyVault();
        const encrypted = await encrypt(JSON.stringify(emptyVault), password);

        ensureVaultDir(vaultPath);
        writeVault(vaultPath, encrypted);

        console.log(`✓ Vault initialized at ${vaultPath}`);
      } catch (err) {
        console.error('Failed to initialize vault:', (err as Error).message);
        process.exit(1);
      }
    });
}
