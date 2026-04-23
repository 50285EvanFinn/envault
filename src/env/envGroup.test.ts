import {
  createEmptyGroupStore,
  createGroup,
  removeGroup,
  addKeyToGroup,
  removeKeyFromGroup,
  getKeysInGroup,
  listAllGroups,
  findGroupsForKey,
} from './envGroup';

describe('envGroup', () => {
  it('createEmptyGroupStore returns empty store', () => {
    const store = createEmptyGroupStore();
    expect(store.groups).toEqual({});
  });

  it('createGroup adds a new group', () => {
    const store = createEmptyGroupStore();
    const updated = createGroup(store, 'production');
    expect(updated.groups['production']).toEqual([]);
  });

  it('createGroup throws if group already exists', () => {
    const store = createGroup(createEmptyGroupStore(), 'production');
    expect(() => createGroup(store, 'production')).toThrow('already exists');
  });

  it('removeGroup removes an existing group', () => {
    const store = createGroup(createEmptyGroupStore(), 'staging');
    const updated = removeGroup(store, 'staging');
    expect(updated.groups['staging']).toBeUndefined();
  });

  it('removeGroup throws if group does not exist', () => {
    expect(() => removeGroup(createEmptyGroupStore(), 'missing')).toThrow('does not exist');
  });

  it('addKeyToGroup adds a key', () => {
    let store = createGroup(createEmptyGroupStore(), 'prod');
    store = addKeyToGroup(store, 'prod', 'API_KEY');
    expect(store.groups['prod']).toContain('API_KEY');
  });

  it('addKeyToGroup does not duplicate keys', () => {
    let store = createGroup(createEmptyGroupStore(), 'prod');
    store = addKeyToGroup(store, 'prod', 'API_KEY');
    store = addKeyToGroup(store, 'prod', 'API_KEY');
    expect(store.groups['prod'].length).toBe(1);
  });

  it('removeKeyFromGroup removes a key', () => {
    let store = createGroup(createEmptyGroupStore(), 'prod');
    store = addKeyToGroup(store, 'prod', 'API_KEY');
    store = removeKeyFromGroup(store, 'prod', 'API_KEY');
    expect(store.groups['prod']).not.toContain('API_KEY');
  });

  it('getKeysInGroup returns keys', () => {
    let store = createGroup(createEmptyGroupStore(), 'prod');
    store = addKeyToGroup(store, 'prod', 'DB_URL');
    expect(getKeysInGroup(store, 'prod')).toEqual(['DB_URL']);
  });

  it('listAllGroups returns group names', () => {
    let store = createGroup(createEmptyGroupStore(), 'prod');
    store = createGroup(store, 'dev');
    expect(listAllGroups(store)).toEqual(expect.arrayContaining(['prod', 'dev']));
  });

  it('findGroupsForKey returns groups containing key', () => {
    let store = createGroup(createEmptyGroupStore(), 'prod');
    store = createGroup(store, 'dev');
    store = addKeyToGroup(store, 'prod', 'API_KEY');
    store = addKeyToGroup(store, 'dev', 'API_KEY');
    const groups = findGroupsForKey(store, 'API_KEY');
    expect(groups).toEqual(expect.arrayContaining(['prod', 'dev']));
  });
});
