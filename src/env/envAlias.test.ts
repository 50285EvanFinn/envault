import {
  createEmptyAliasStore,
  setAlias,
  removeAlias,
  resolveAlias,
  getAliasesForKey,
  listAllAliases,
} from "./envAlias";

describe("envAlias", () => {
  it("creates an empty alias store", () => {
    const store = createEmptyAliasStore();
    expect(store.aliases).toEqual({});
  });

  it("sets an alias", () => {
    const store = createEmptyAliasStore();
    const updated = setAlias(store, "db", "DATABASE_URL");
    expect(updated.aliases["db"]).toBe("DATABASE_URL");
  });

  it("throws when alias or key is empty", () => {
    const store = createEmptyAliasStore();
    expect(() => setAlias(store, "", "KEY")).toThrow();
    expect(() => setAlias(store, "alias", "")).toThrow();
  });

  it("removes an alias", () => {
    let store = createEmptyAliasStore();
    store = setAlias(store, "db", "DATABASE_URL");
    store = removeAlias(store, "db");
    expect(store.aliases["db"]).toBeUndefined();
  });

  it("resolves an alias to its key", () => {
    let store = createEmptyAliasStore();
    store = setAlias(store, "db", "DATABASE_URL");
    expect(resolveAlias(store, "db")).toBe("DATABASE_URL");
  });

  it("returns original string if no alias found", () => {
    const store = createEmptyAliasStore();
    expect(resolveAlias(store, "UNKNOWN_KEY")).toBe("UNKNOWN_KEY");
  });

  it("gets all aliases for a key", () => {
    let store = createEmptyAliasStore();
    store = setAlias(store, "db", "DATABASE_URL");
    store = setAlias(store, "database", "DATABASE_URL");
    const aliases = getAliasesForKey(store, "DATABASE_URL");
    expect(aliases).toContain("db");
    expect(aliases).toContain("database");
    expect(aliases).toHaveLength(2);
  });

  it("lists all aliases", () => {
    let store = createEmptyAliasStore();
    store = setAlias(store, "db", "DATABASE_URL");
    store = setAlias(store, "port", "PORT");
    const all = listAllAliases(store);
    expect(all).toHaveLength(2);
    expect(all).toContainEqual({ alias: "db", key: "DATABASE_URL" });
    expect(all).toContainEqual({ alias: "port", key: "PORT" });
  });
});
