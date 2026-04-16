import {
  createEmptyNoteStore,
  setNote,
  removeNote,
  getNote,
  hasNote,
  listNotes,
} from './envNote';

describe('envNote', () => {
  it('creates empty note store', () => {
    const store = createEmptyNoteStore();
    expect(store.notes).toEqual({});
  });

  it('sets a note for a key', () => {
    const store = setNote(createEmptyNoteStore(), 'API_KEY', 'Rotate monthly');
    expect(store.notes['API_KEY'].note).toBe('Rotate monthly');
    expect(store.notes['API_KEY'].key).toBe('API_KEY');
    expect(store.notes['API_KEY'].updatedAt).toBeDefined();
  });

  it('overwrites existing note', () => {
    let store = setNote(createEmptyNoteStore(), 'API_KEY', 'Old note');
    store = setNote(store, 'API_KEY', 'New note');
    expect(store.notes['API_KEY'].note).toBe('New note');
  });

  it('removes a note', () => {
    let store = setNote(createEmptyNoteStore(), 'API_KEY', 'Some note');
    store = removeNote(store, 'API_KEY');
    expect(store.notes['API_KEY']).toBeUndefined();
  });

  it('gets a note', () => {
    const store = setNote(createEmptyNoteStore(), 'DB_URL', 'Production DB');
    const record = getNote(store, 'DB_URL');
    expect(record?.note).toBe('Production DB');
  });

  it('returns undefined for missing note', () => {
    expect(getNote(createEmptyNoteStore(), 'MISSING')).toBeUndefined();
  });

  it('checks if note exists', () => {
    let store = setNote(createEmptyNoteStore(), 'KEY', 'note');
    expect(hasNote(store, 'KEY')).toBe(true);
    expect(hasNote(store, 'OTHER')).toBe(false);
  });

  it('lists all notes', () => {
    let store = createEmptyNoteStore();
    store = setNote(store, 'A', 'Note A');
    store = setNote(store, 'B', 'Note B');
    const notes = listNotes(store);
    expect(notes).toHaveLength(2);
  });
});
