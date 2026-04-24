import { Command } from "commander";
import * as readline from "readline";
import { readVault, writeVault } from "../../storage/vaultFile";
import { decrypt, encrypt } from "../../crypto/vault";
import {
  createEmptyDependencyStore,
  setDependency,
  removeDependency,
  getDependency,
  resolveDependencyOrder,
  findDependents,
  listAllDependencies,
} from "../../env/envDependency";

export function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function registerDependencyCommand(program: Command): void {
  const dep = program.command("dependency").description("Manage key dependencies");

  dep
    .command("set <key> <deps...>")
    .description("Set dependencies for a key")
    .action(async (key: string, deps: string[]) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.dependencies ?? createEmptyDependencyStore();
      const updated = setDependency(store, key, deps);
      payload.dependencies = updated;
      const { data, iv, salt } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ data, iv, salt });
      console.log(`Dependencies for "${key}" set to: ${deps.join(", ")}`);
    });

  dep
    .command("remove <key>")
    .description("Remove dependency rule for a key")
    .action(async (key: string) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.dependencies ?? createEmptyDependencyStore();
      payload.dependencies = removeDependency(store, key);
      const { data, iv, salt } = await encrypt(JSON.stringify(payload), password);
      await writeVault({ data, iv, salt });
      console.log(`Dependency rule for "${key}" removed.`);
    });

  dep
    .command("show <key>")
    .description("Show dependencies for a key")
    .action(async (key: string) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.dependencies ?? createEmptyDependencyStore();
      const rule = getDependency(store, key);
      if (!rule) {
        console.log(`No dependencies defined for "${key}".`);
      } else {
        console.log(`"${key}" depends on: ${rule.dependsOn.join(", ")}`);
      }
    });

  dep
    .command("order <keys...>")
    .description("Resolve load order for given keys")
    .action(async (keys: string[]) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.dependencies ?? createEmptyDependencyStore();
      const order = resolveDependencyOrder(store, keys);
      console.log("Resolved order:");
      order.forEach((k, i) => console.log(`  ${i + 1}. ${k}`));
    });

  dep
    .command("dependents <key>")
    .description("List keys that depend on a given key")
    .action(async (key: string) => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.dependencies ?? createEmptyDependencyStore();
      const dependents = findDependents(store, key);
      if (dependents.length === 0) {
        console.log(`No keys depend on "${key}".`);
      } else {
        console.log(`Keys depending on "${key}": ${dependents.join(", ")}`);
      }
    });

  dep
    .command("list")
    .description("List all dependency rules")
    .action(async () => {
      const password = await promptPassword("Vault password: ");
      const raw = await readVault();
      const payload = JSON.parse(await decrypt(raw.data, raw.iv, raw.salt, password));
      const store = payload.dependencies ?? createEmptyDependencyStore();
      const all = listAllDependencies(store);
      if (all.length === 0) {
        console.log("No dependency rules defined.");
      } else {
        all.forEach((r) => console.log(`  ${r.key} -> [${r.dependsOn.join(", ")}]`));
      }
    });
}
