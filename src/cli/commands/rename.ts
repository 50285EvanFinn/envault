import { Command } from 'commander';
import { readVault, writeVault, vaultExists } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { getEntry, setEntry, removeEntry } from '../../env/envManager';
import * as readline from 'readline';

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    process.stdin.setRawMode?.(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.setRawMode?.(false);
        rl.close();
        console.log();
        resolve(password);
      } else if (c === '\u0003') {
        process.exit();
      } else {
        password += c;
      }
    });
  });
}

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <oldKey> <newKey>')
    .alias('mv')
    .description('Rename an environment variable key')
    .option('--overwrite', 'Overwrite destination key if it already exists', false)
    .action(async (oldKey: string, newKey: string, options: { overwrite: boolean }) => {
      try {
        if (!vaultExists()) {
          console.error('No vault found. Run `envault init` first.');
          process.exit(1);
        }

        const password = await promptPassword('Enter vault password: ');
        const encryptedVault = readVault();
        const vault = await decrypt(encryptedVault, password);

        const sourceEntry = getEntry(vault, oldKey);
        if (!sourceEntry) {
          console.error(`Key "${oldKey}" not found in vault.`);
          process.exit(1);
        }

        const destEntry = getEntry(vault, newKey);
        if (destEntry && !options.overwrite) {
          console.error(`Key "${newKey}" already exists. Use --overwrite to replace it.`);
          process.exit(1);
        }

        const withNew = setEntry(vault, newKey, sourceEntry.value);
        const withoutOld = removeEntry(withNew, oldKey);
        const newEncrypted = await encrypt(withoutOld, password);
        writeVault(newEncrypted);

        console.log(`Renamed "${oldKey}" to "${newKey}" successfully.`);
      } catch (err) {
        console.error('Failed to rename key:', (err as Error).message);
        process.exit(1);
      }
    });
}
