import { Command } from 'commander';
import { readVault, writeVault, vaultExists } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { getEntry, setEntry } from '../../env/envManager';
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

export function registerCopyCommand(program: Command): void {
  program
    .command('copy <sourceKey> <destKey>')
    .alias('cp')
    .description('Copy an environment variable to a new key')
    .option('--overwrite', 'Overwrite destination key if it already exists', false)
    .action(async (sourceKey: string, destKey: string, options: { overwrite: boolean }) => {
      try {
        if (!vaultExists()) {
          console.error('No vault found. Run `envault init` first.');
          process.exit(1);
        }

        const password = await promptPassword('Enter vault password: ');
        const encryptedVault = readVault();
        const vault = await decrypt(encryptedVault, password);

        const sourceEntry = getEntry(vault, sourceKey);
        if (!sourceEntry) {
          console.error(`Key "${sourceKey}" not found in vault.`);
          process.exit(1);
        }

        const destEntry = getEntry(vault, destKey);
        if (destEntry && !options.overwrite) {
          console.error(`Key "${destKey}" already exists. Use --overwrite to replace it.`);
          process.exit(1);
        }

        const updatedVault = setEntry(vault, destKey, sourceEntry.value);
        const newEncrypted = await encrypt(updatedVault, password);
        writeVault(newEncrypted);

        console.log(`Copied "${sourceKey}" to "${destKey}" successfully.`);
      } catch (err) {
        console.error('Failed to copy key:', (err as Error).message);
        process.exit(1);
      }
    });
}
