export interface NoteRecord {
  key: string;
  note: string;
  updatedAt: string;
}

export interface NoteStore {
  notes: Record<string, NoteRecord>;
}

export function createEmptyNoteStore(): NoteStore {
  return { notes: {} };
}

export function setNote(store: NoteStore, key: string, note: string): NoteStore {
  return {
    ...store,
    notes: {
      ...store.notes,
      [key]: { key, note, updatedAt: new Date().toISOString() },
    },
  };
}

export function removeNote(store: NoteStore, key: string): NoteStore {
  const notes = { ...store.notes };
  delete notes[key];
  return { ...store, notes };
}

export function getNote(store: NoteStore, key: string): NoteRecord | undefined {
  return store.notes[key];
}

export function hasNote(store: NoteStore, key: string): boolean {
  return key in store.notes;
}

export function listNotes(store: NoteStore): NoteRecord[] {
  return Object.values(store.notes);
}
