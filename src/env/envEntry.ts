export interface EnvEntry {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvVault {
  version: number;
  entries: Record<string, EnvEntry>;
}

export function createEntry(key: string, value: string): EnvEntry {
  const now = new Date().toISOString();
  return {
    key,
    value,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateEntry(existing: EnvEntry, value: string): EnvEntry {
  return {
    ...existing,
    value,
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyVault(): EnvVault {
  return {
    version: 1,
    entries: {},
  };
}
