import {
  createEmptyProfileStore,
  createProfile,
  addProfile,
  removeProfile,
  getProfile,
  addKeyToProfile,
  removeKeyFromProfile,
  listProfiles,
} from './envProfile';

describe('envProfile', () => {
  describe('createEmptyProfileStore', () => {
    it('returns an empty profiles object', () => {
      const store = createEmptyProfileStore();
      expect(store.profiles).toEqual({});
    });
  });

  describe('createProfile', () => {
    it('creates a profile with the given name and keys', () => {
      const profile = createProfile('production', ['DB_URL', 'API_KEY'], 'Prod env');
      expect(profile.name).toBe('production');
      expect(profile.keys).toEqual(['DB_URL', 'API_KEY']);
      expect(profile.description).toBe('Prod env');
      expect(profile.createdAt).toBeDefined();
    });

    it('defaults to empty keys array', () => {
      const profile = createProfile('staging');
      expect(profile.keys).toEqual([]);
    });
  });

  describe('addProfile', () => {
    it('adds a profile to the store', () => {
      const store = createEmptyProfileStore();
      const profile = createProfile('dev');
      const updated = addProfile(store, profile);
      expect(updated.profiles['dev']).toEqual(profile);
    });
  });

  describe('removeProfile', () => {
    it('removes a profile by name', () => {
      let store = createEmptyProfileStore();
      store = addProfile(store, createProfile('dev'));
      store = removeProfile(store, 'dev');
      expect(store.profiles['dev']).toBeUndefined();
    });

    it('is a no-op for non-existent profile', () => {
      const store = createEmptyProfileStore();
      const updated = removeProfile(store, 'ghost');
      expect(updated).toEqual(store);
    });
  });

  describe('getProfile', () => {
    it('returns the profile if it exists', () => {
      let store = createEmptyProfileStore();
      const profile = createProfile('prod');
      store = addProfile(store, profile);
      expect(getProfile(store, 'prod')).toEqual(profile);
    });

    it('returns undefined for missing profile', () => {
      const store = createEmptyProfileStore();
      expect(getProfile(store, 'missing')).toBeUndefined();
    });
  });

  describe('addKeyToProfile', () => {
    it('adds a key to a profile', () => {
      let store = createEmptyProfileStore();
      store = addProfile(store, createProfile('dev'));
      store = addKeyToProfile(store, 'dev', 'SECRET');
      expect(store.profiles['dev'].keys).toContain('SECRET');
    });

    it('does not duplicate keys', () => {
      let store = createEmptyProfileStore();
      store = addProfile(store, createProfile('dev', ['SECRET']));
      store = addKeyToProfile(store, 'dev', 'SECRET');
      expect(store.profiles['dev'].keys.filter((k) => k === 'SECRET').length).toBe(1);
    });
  });

  describe('removeKeyFromProfile', () => {
    it('removes a key from a profile', () => {
      let store = createEmptyProfileStore();
      store = addProfile(store, createProfile('dev', ['SECRET', 'TOKEN']));
      store = removeKeyFromProfile(store, 'dev', 'SECRET');
      expect(store.profiles['dev'].keys).not.toContain('SECRET');
      expect(store.profiles['dev'].keys).toContain('TOKEN');
    });
  });

  describe('listProfiles', () => {
    it('returns all profiles as an array', () => {
      let store = createEmptyProfileStore();
      store = addProfile(store, createProfile('dev'));
      store = addProfile(store, createProfile('prod'));
      const profiles = listProfiles(store);
      expect(profiles.length).toBe(2);
    });
  });
});
