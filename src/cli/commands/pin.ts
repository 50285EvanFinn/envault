import { Command } from "commander";
import * as readline from "readline";
import { decrypt, encrypt, deriveKey } from "../../crypto/vault";
import { readVault, writeVault, vaultExists } from "../../storage/vaultFile";
import {
  createEmptyPinStore,
  pinKey,
  unpinKey,
  isPinned,
  listPins,
  clearPins,
} from "../../env/envPin";

export function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
}

export function registerPinCommand(program: Command): void {
  const pin = program.command("pin").description("Manage pinned (favorite) keys");

  pin
    .command("add <key>")
    .description("Pin a key")
    .action(async (key: string) => {
      if (!vaultExists()) { console.error("No vault found. Run 'envault init' first."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const raw = readVault();
      const keyBuf = await deriveKey(password, Buffer.from(raw.salt, "hex"));
      const payload = JSON.parse(await decrypt(raw.data, keyBuf));
      payload.pins = pinKey(payload.pins ?? createEmptyPinStore(), key);
      raw.data = await encrypt(JSON.stringify(payload), keyBuf);
      writeVault(raw);
      console.log(`Pinned '${key}'.`);
    });

  pin
    .command("remove <key>")
    .description("Unpin a key")
    .action(async (key: string) => {
      if (!vaultExists()) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const raw = readVault();
      const keyBuf = await deriveKey(password, Buffer.from(raw.salt, "hex"));
      const payload = JSON.parse(await decrypt(raw.data, keyBuf));
      payload.pins = unpinKey(payload.pins ?? createEmptyPinStore(), key);
      raw.data = await encrypt(JSON.stringify(payload), keyBuf);
      writeVault(raw);
      console.log(`Unpinned '${key}'.`);
    });

  pin
    .command("list")
    .description("List all pinned keys")
    .action(async () => {
      if (!vaultExists()) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const raw = readVault();
      const keyBuf = await deriveKey(password, Buffer.from(raw.salt, "hex"));
      const payload = JSON.parse(await decrypt(raw.data, keyBuf));
      const pins = listPins(payload.pins ?? createEmptyPinStore());
      if (pins.length === 0) { console.log("No pinned keys."); return; }
      pins.forEach((k, i) => console.log(`${i + 1}. ${k}${isPinned(payload.pins, k) ? " 📌" : ""}`));
    });

  pin
    .command("clear")
    .description("Remove all pins")
    .action(async () => {
      if (!vaultExists()) { console.error("No vault found."); process.exit(1); }
      const password = await promptPassword("Password: ");
      const raw = readVault();
      const keyBuf = await deriveKey(password, Buffer.from(raw.salt, "hex"));
      const payload = JSON.parse(await decrypt(raw.data, keyBuf));
      payload.pins = clearPins(payload.pins ?? createEmptyPinStore());
      raw.data = await encrypt(JSON.stringify(payload), keyBuf);
      writeVault(raw);
      console.log("All pins cleared.");
    });
}
