import { Command } from "commander";
import { readVault, writeVault, getVaultPath } from "../../storage/vaultFile";
import { decrypt, encrypt } from "../../crypto/vault";
import {
  addTag,
  removeTag,
  getTagsForKey,
  findKeysByTag,
  listAllTags,
} from "../../env/envTags";
import { hasEntry } from "../../env/envManager";

export function registerTagCommand(program: Command): void {
  const tag = program.command("tag").description("Manage tags for env keys");

  tag
    .command("add <key> <tag>")
    .description("Add a tag to an env key")
    .option("-p, --password <password>", "Vault password")
    .action(async (key: string, tagName: string, opts: { password?: string }) => {
      const password = opts.password ?? "";
      const vaultPath = getVaultPath();
      const raw = await readVault(vaultPath);
      const payload = await decrypt(raw.data, raw.iv, raw.salt, password);
      if (!hasEntry(payload, key)) {
        console.error(`Key "${key}" not found in vault.`);
        process.exit(1);
      }
      const tags = payload.tags ?? {};
      payload.tags = addTag(tags, key, tagName);
      const encrypted = await encrypt(payload, password);
      await writeVault(vaultPath, encrypted);
      console.log(`Tag "${tagName}" added to "${key}".`);
    });

  tag
    .command("remove <key> <tag>")
    .description("Remove a tag from an env key")
    .option("-p, --password <password>", "Vault password")
    .action(async (key: string, tagName: string, opts: { password?: string }) => {
      const password = opts.password ?? "";
      const vaultPath = getVaultPath();
      const raw = await readVault(vaultPath);
      const payload = await decrypt(raw.data, raw.iv, raw.salt, password);
      const tags = payload.tags ?? {};
      payload.tags = removeTag(tags, key, tagName);
      const encrypted = await encrypt(payload, password);
      await writeVault(vaultPath, encrypted);
      console.log(`Tag "${tagName}" removed from "${key}".`);
    });

  tag
    .command("list [key]")
    .description("List tags for a key or all tags in the vault")
    .option("-p, --password <password>", "Vault password")
    .action(async (key: string | undefined, opts: { password?: string }) => {
      const password = opts.password ?? "";
      const vaultPath = getVaultPath();
      const raw = await readVault(vaultPath);
      const payload = await decrypt(raw.data, raw.iv, raw.salt, password);
      const tags = payload.tags ?? {};
      if (key) {
        const keyTags = getTagsForKey(tags, key);
        if (keyTags.length === 0) {
          console.log(`No tags for "${key}".`);
        } else {
          console.log(`Tags for "${key}": ${keyTags.join(", ")}`);
        }
      } else {
        const all = listAllTags(tags);
        if (all.length === 0) {
          console.log("No tags found in vault.");
        } else {
          console.log("All tags:", all.join(", "));
        }
      }
    });

  tag
    .command("find <tag>")
    .description("Find all keys with a given tag")
    .option("-p, --password <password>", "Vault password")
    .action(async (tagName: string, opts: { password?: string }) => {
      const password = opts.password ?? "";
      const vaultPath = getVaultPath();
      const raw = await readVault(vaultPath);
      const payload = await decrypt(raw.data, raw.iv, raw.salt, password);
      const tags = payload.tags ?? {};
      const keys = findKeysByTag(tags, tagName);
      if (keys.length === 0) {
        console.log(`No keys found with tag "${tagName}".`);
      } else {
        console.log(`Keys tagged "${tagName}":`);
        keys.forEach((k) => console.log(`  ${k}`));
      }
    });
}
