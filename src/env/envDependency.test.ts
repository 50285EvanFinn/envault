import {
  createEmptyDependencyStore,
  setDependency,
  removeDependency,
  getDependency,
  resolveDependencyOrder,
  findDependents,
  listAllDependencies,
} from "./envDependency";

describe("envDependency", () => {
  it("creates an empty dependency store", () => {
    const store = createEmptyDependencyStore();
    expect(store.rules).toEqual({});
  });

  it("sets a dependency rule", () => {
    const store = createEmptyDependencyStore();
    const updated = setDependency(store, "DB_URL", ["DB_HOST", "DB_PORT"]);
    const rule = updated.rules["DB_URL"];
    expect(rule).toBeDefined();
    expect(rule.key).toBe("DB_URL");
    expect(rule.dependsOn).toContain("DB_HOST");
    expect(rule.dependsOn).toContain("DB_PORT");
  });

  it("deduplicates dependsOn entries", () => {
    const store = createEmptyDependencyStore();
    const updated = setDependency(store, "A", ["B", "B", "C"]);
    expect(updated.rules["A"].dependsOn).toEqual(["B", "C"]);
  });

  it("removes a dependency rule", () => {
    let store = createEmptyDependencyStore();
    store = setDependency(store, "DB_URL", ["DB_HOST"]);
    store = removeDependency(store, "DB_URL");
    expect(store.rules["DB_URL"]).toBeUndefined();
  });

  it("gets a dependency rule", () => {
    let store = createEmptyDependencyStore();
    store = setDependency(store, "API_URL", ["API_HOST"]);
    const rule = getDependency(store, "API_URL");
    expect(rule).toBeDefined();
    expect(rule?.key).toBe("API_URL");
  });

  it("returns undefined for missing key", () => {
    const store = createEmptyDependencyStore();
    expect(getDependency(store, "MISSING")).toBeUndefined();
  });

  it("resolves dependency order correctly", () => {
    let store = createEmptyDependencyStore();
    store = setDependency(store, "C", ["B"]);
    store = setDependency(store, "B", ["A"]);
    const order = resolveDependencyOrder(store, ["C"]);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("C"));
  });

  it("finds dependents of a key", () => {
    let store = createEmptyDependencyStore();
    store = setDependency(store, "DB_URL", ["DB_HOST"]);
    store = setDependency(store, "API_URL", ["DB_HOST", "API_KEY"]);
    const dependents = findDependents(store, "DB_HOST");
    expect(dependents).toContain("DB_URL");
    expect(dependents).toContain("API_URL");
  });

  it("lists all dependency rules", () => {
    let store = createEmptyDependencyStore();
    store = setDependency(store, "X", ["Y"]);
    store = setDependency(store, "Z", ["Y"]);
    const all = listAllDependencies(store);
    expect(all).toHaveLength(2);
  });
});
