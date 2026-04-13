export interface Profile {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  keys: string[];
}

export interface ProfileStore {
  profiles: Record<string, Profile>;
}

export function createEmptyProfileStore(): ProfileStore {
  return { profiles: {} };
}

export function createProfile(
  name: string,
  keys: string[] = [],
  description?: string
): Profile {
  const now = new Date().toISOString();
  return { name, description, createdAt: now, updatedAt: now, keys: [...keys] };
}

export function addProfile(store: ProfileStore, profile: Profile): ProfileStore {
  return {
    profiles: {
      ...store.profiles,
      [profile.name]: profile,
    },
  };
}

export function removeProfile(store: ProfileStore, name: string): ProfileStore {
  const { [name]: _, ...rest } = store.profiles;
  return { profiles: rest };
}

export function getProfile(store: ProfileStore, name: string): Profile | undefined {
  return store.profiles[name];
}

export function addKeyToProfile(
  store: ProfileStore,
  profileName: string,
  key: string
): ProfileStore {
  const profile = store.profiles[profileName];
  if (!profile) return store;
  if (profile.keys.includes(key)) return store;
  const updated: Profile = {
    ...profile,
    keys: [...profile.keys, key],
    updatedAt: new Date().toISOString(),
  };
  return { profiles: { ...store.profiles, [profileName]: updated } };
}

export function removeKeyFromProfile(
  store: ProfileStore,
  profileName: string,
  key: string
): ProfileStore {
  const profile = store.profiles[profileName];
  if (!profile) return store;
  const updated: Profile = {
    ...profile,
    keys: profile.keys.filter((k) => k !== key),
    updatedAt: new Date().toISOString(),
  };
  return { profiles: { ...store.profiles, [profileName]: updated } };
}

export function listProfiles(store: ProfileStore): Profile[] {
  return Object.values(store.profiles);
}
