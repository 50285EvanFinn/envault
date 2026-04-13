import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault, vaultExists } from '../../storage/vaultFile';
import { decrypt, encrypt, deriveKey } from '../../crypto/vault';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function registerRotateCommand(program: Command): Promise<void> {
  program
    .command('rotate')
    .description('Re-encrypt the vault with a new master password')
    .option('--vault <path>', 'path to vault file')
    .action(async (options) => {
      try {
        const vaultPath = options.vault;

        if (!(await vaultExists(vaultPath))) {
          console.error('No vault found. Run `envault init` first.');
          process.exit(1);
        }

        const currentPassword = await promptPassword('Current master password: ');
        const encryptedVault = await readVault(vaultPath);

        let vaultData: string;
        try {
          const currentKey = await deriveKey(currentPassword, Buffer.from(encryptedVault.salt, 'hex'));
          vaultData = await decrypt(encryptedVault.data, currentKey, encryptedVault.iv);
        } catch {
          console.error('Error: Incorrect current password.');
          process.exit(1);
        }

        const newPassword = await promptPassword('New master password: ');
        const confirmPassword = await promptPassword('Confirm new master password: ');

        if (newPassword !== confirmPassword) {
          console.error('Error: Passwords do not match.');
          process.exit(1);
        }

        if (newPassword.length < 8) {
          console.error('Error: Password must be at least 8 characters.');
          process.exit(1);
        }

        const newSalt = require('crypto').randomBytes(16);
        const newKey = await deriveKey(newPassword, newSalt);
        const { encrypted, iv } = await encrypt(vaultData, newKey);

        await writeVault(vaultPath, {
          data: encrypted,
          iv,
          salt: newSalt.toString('hex'),
        });

        console.log('Vault password rotated successfully.');
      } catch (err) {
        console.error('Failed to rotate vault password:', (err as Error).message);
        process.exit(1);
      }
    });
}
