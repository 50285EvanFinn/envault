import { Command } from "commander";
import { readVault, writeVault } from "../../storage/vaultFile";
import { decrypt, encrypt } from "../../crypto/vault";
import {
  createEmptyAliasStore,
  setAlias,
  removeAlias,
  listAllAliases,
  resolveAlias,
} from "../../env/envAlias";
import * as readline from "readline";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerAliasCommand(program: Command): void {
  const alias = program.command("alias").description("Manage key aliases");

  alias
    .command("set <alias> <key>")
    .description("Create an alias for an environment variable key")
    .action(async (aliasName: string, key: string) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.aliases ? { aliases: payload.aliases } : createEmptyAliasStore();
      const updated = setAlias(store, aliasName, key);
      payload.aliases = updated.aliases;
      const encrypted = await encrypt(JSON.stringify(payload), password);
      await writeVault(encrypted);
      console.log(`Alias "${aliasName}" -> "${key}" saved.`);
    });

  alias
    .command("remove <alias>")
    .description("Remove an alias")
    .action(async (aliasName: string) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.aliases ? { aliases: payload.aliases } : createEmptyAliasStore();
      const updated = removeAlias(store, aliasName);
      payload.aliases = updated.aliases;
      const encrypted = await encrypt(JSON.stringify(payload), password);
      await writeVault(encrypted);
      console.log(`Alias "${aliasName}" removed.`);
    });

  alias
    .command("list")
    .description("List all aliases")
    .action(async () => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.aliases ? { aliases: payload.aliases } : createEmptyAliasStore();
      const all = listAllAliases(store);
      if (all.length === 0) {
        console.log("No aliases defined.");
        return;
      }
      all.forEach(({ alias, key }) => console.log(`${alias} -> ${key}`));
    });

  alias
    .command("resolve <alias>")
    .description("Resolve an alias to its original key")
    .action(async (aliasName: string) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.aliases ? { aliases: payload.aliases } : createEmptyAliasStore();
      const resolved = resolveAlias(store, aliasName);
      console.log(resolved);
    });
}
