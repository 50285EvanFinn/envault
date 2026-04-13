export interface AliasMap {
  [alias: string]: string;
}

export interface AliasStore {
  aliases: AliasMap;
}

export function createEmptyAliasStore(): AliasStore {
  return { aliases: {} };
}

export function setAlias(
  store: AliasStore,
  alias: string,
  key: string
): AliasStore {
  if (!alias || !key) throw new Error("Alias and key must be non-empty strings");
  return {
    aliases: { ...store.aliases, [alias]: key },
  };
}

export function removeAlias(store: AliasStore, alias: string): AliasStore {
  const { [alias]: _, ...rest } = store.aliases;
  return { aliases: rest };
}

export function resolveAlias(
  store: AliasStore,
  aliasOrKey: string
): string {
  return store.aliases[aliasOrKey] ?? aliasOrKey;
}

export function getAliasesForKey(
  store: AliasStore,
  key: string
): string[] {
  return Object.entries(store.aliases)
    .filter(([, v]) => v === key)
    .map(([alias]) => alias);
}

export function listAllAliases(store: AliasStore): Array<{ alias: string; key: string }> {
  return Object.entries(store.aliases).map(([alias, key]) => ({ alias, key }));
}
