import {
  createEmptyCommentStore,
  setComment,
  removeComment,
  getComment,
  hasComment,
  listCommentedKeys,
} from './envComment';

describe('envComment', () => {
  it('creates an empty comment store', () => {
    const store = createEmptyCommentStore();
    expect(store.comments).toEqual({});
  });

  it('sets a comment for a key', () => {
    const store = createEmptyCommentStore();
    const updated = setComment(store, 'API_KEY', 'Used for external API auth');
    expect(updated.comments['API_KEY']).toBe('Used for external API auth');
  });

  it('overwrites an existing comment', () => {
    let store = createEmptyCommentStore();
    store = setComment(store, 'API_KEY', 'Old comment');
    store = setComment(store, 'API_KEY', 'New comment');
    expect(getComment(store, 'API_KEY')).toBe('New comment');
  });

  it('removes a comment', () => {
    let store = createEmptyCommentStore();
    store = setComment(store, 'DB_URL', 'Database connection string');
    store = removeComment(store, 'DB_URL');
    expect(hasComment(store, 'DB_URL')).toBe(false);
  });

  it('returns undefined for missing comment', () => {
    const store = createEmptyCommentStore();
    expect(getComment(store, 'MISSING')).toBeUndefined();
  });

  it('lists all commented keys', () => {
    let store = createEmptyCommentStore();
    store = setComment(store, 'KEY_A', 'comment a');
    store = setComment(store, 'KEY_B', 'comment b');
    const keys = listCommentedKeys(store);
    expect(keys).toContain('KEY_A');
    expect(keys).toContain('KEY_B');
    expect(keys).toHaveLength(2);
  });

  it('does not mutate original store', () => {
    const store = createEmptyCommentStore();
    setComment(store, 'X', 'value');
    expect(store.comments).toEqual({});
  });
});
