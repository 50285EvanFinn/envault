import { Command } from 'commander';
import * as readline from 'readline';
import { readVault, writeVault } from '../../storage/vaultFile';
import { decrypt, encrypt } from '../../crypto/vault';
import { createEmptyNoteStore, setNote, removeNote, getNote, listNotes } from '../../env/envNote';

export function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function registerNoteCommand(program: Command): void {
  const note = program.command('note').description('Manage notes for environment variable keys');

  note.command('set <key> <text>')
    .description('Set a note for a key')
    .action(async (key: string, text: string) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = decrypt(raw.data, password, raw.iv, raw.salt);
      payload.notes = setNote(payload.notes ?? createEmptyNoteStore(), key, text);
      const { iv, salt, data } = encrypt(payload, password);
      await writeVault({ iv, salt, data });
      console.log(`Note set for "${key}".`);
    });

  note.command('get <key>')
    .description('Get the note for a key')
    .action(async (key: string) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = decrypt(raw.data, password, raw.iv, raw.salt);
      const record = getNote(payload.notes ?? createEmptyNoteStore(), key);
      if (!record) { console.log(`No note found for "${key}".`); return; }
      console.log(`${key}: ${record.note}`);
    });

  note.command('remove <key>')
    .description('Remove the note for a key')
    .action(async (key: string) => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = decrypt(raw.data, password, raw.iv, raw.salt);
      payload.notes = removeNote(payload.notes ?? createEmptyNoteStore(), key);
      const { iv, salt, data } = encrypt(payload, password);
      await writeVault({ iv, salt, data });
      console.log(`Note removed for "${key}".`);
    });

  note.command('list')
    .description('List all notes')
    .action(async () => {
      const password = await promptPassword('Password: ');
      const raw = await readVault();
      const payload = decrypt(raw.data, password, raw.iv, raw.salt);
      const notes = listNotes(payload.notes ?? createEmptyNoteStore());
      if (notes.length === 0) { console.log('No notes found.'); return; }
      notes.forEach((r) => console.log(`${r.key}: ${r.note}`));
    });
}
