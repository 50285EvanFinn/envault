export interface GroupStore {
  groups: Record<string, string[]>; // groupName -> list of keys
}

export function createEmptyGroupStore(): GroupStore {
  return { groups: {} };
}

export function createGroup(store: GroupStore, groupName: string): GroupStore {
  if (store.groups[groupName]) {
    throw new Error(`Group "${groupName}" already exists`);
  }
  return { groups: { ...store.groups, [groupName]: [] } };
}

export function removeGroup(store: GroupStore, groupName: string): GroupStore {
  if (!store.groups[groupName]) {
    throw new Error(`Group "${groupName}" does not exist`);
  }
  const updated = { ...store.groups };
  delete updated[groupName];
  return { groups: updated };
}

export function addKeyToGroup(store: GroupStore, groupName: string, key: string): GroupStore {
  if (!store.groups[groupName]) {
    throw new Error(`Group "${groupName}" does not exist`);
  }
  if (store.groups[groupName].includes(key)) {
    return store;
  }
  return {
    groups: {
      ...store.groups,
      [groupName]: [...store.groups[groupName], key],
    },
  };
}

export function removeKeyFromGroup(store: GroupStore, groupName: string, key: string): GroupStore {
  if (!store.groups[groupName]) {
    throw new Error(`Group "${groupName}" does not exist`);
  }
  return {
    groups: {
      ...store.groups,
      [groupName]: store.groups[groupName].filter((k) => k !== key),
    },
  };
}

export function getKeysInGroup(store: GroupStore, groupName: string): string[] {
  if (!store.groups[groupName]) {
    throw new Error(`Group "${groupName}" does not exist`);
  }
  return [...store.groups[groupName]];
}

export function listAllGroups(store: GroupStore): string[] {
  return Object.keys(store.groups);
}

export function findGroupsForKey(store: GroupStore, key: string): string[] {
  return Object.entries(store.groups)
    .filter(([, keys]) => keys.includes(key))
    .map(([groupName]) => groupName);
}
