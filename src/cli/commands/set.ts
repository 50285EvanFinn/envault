import { Command } from 'commander';
import { readVault, writeVault, vaultExists, ensureVaultDir } from '../../storage/vaultFile';
import { encrypt } from '../../crypto/vault';
import { createEntry, updateEntry, createEmptyVault } from '../../env/envEntry';
import { getPassword } from '../prompt';

export const setCommand = new Command('set')
  .description('Set an environment variable in the vault')
  .argument('<key>', 'Environment variable key')
  .argument('<value>', 'Environment variable value')
  .option('-v, --vault <name>', 'Vault name', 'default')
  .action(async (key: string, value: string, options: { vault: string }) => {
    try {
      const password = await getPassword('Enter vault password: ');

      await ensureVaultDir();

      let vault = vaultExists(options.vault)
        ? await readVault(options.vault, password)
        : createEmptyVault();

      const existingEntry = vault.entries.find((e) => e.key === key);

      if (existingEntry) {
        vault.entries = vault.entries.map((e) =>
          e.key === key ? updateEntry(e, value) : e
        );
        console.log(`Updated "${key}" in vault "${options.vault}".`);
      } else {
        const entry = createEntry(key, value);
        vault.entries.push(entry);
        console.log(`Set "${key}" in vault "${options.vault}".`);
      }

      await writeVault(options.vault, vault, password);
    } catch (err: any) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });
