export interface DependencyRule {
  key: string;
  dependsOn: string[];
  createdAt: string;
}

export interface DependencyStore {
  rules: Record<string, DependencyRule>;
}

export function createEmptyDependencyStore(): DependencyStore {
  return { rules: {} };
}

export function setDependency(
  store: DependencyStore,
  key: string,
  dependsOn: string[]
): DependencyStore {
  return {
    ...store,
    rules: {
      ...store.rules,
      [key]: {
        key,
        dependsOn: [...new Set(dependsOn)],
        createdAt: new Date().toISOString(),
      },
    },
  };
}

export function removeDependency(
  store: DependencyStore,
  key: string
): DependencyStore {
  const rules = { ...store.rules };
  delete rules[key];
  return { ...store, rules };
}

export function getDependency(
  store: DependencyStore,
  key: string
): DependencyRule | undefined {
  return store.rules[key];
}

export function resolveDependencyOrder(
  store: DependencyStore,
  keys: string[]
): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(key: string): void {
    if (visited.has(key)) return;
    visited.add(key);
    const rule = store.rules[key];
    if (rule) {
      for (const dep of rule.dependsOn) {
        visit(dep);
      }
    }
    result.push(key);
  }

  for (const key of keys) {
    visit(key);
  }

  return result;
}

export function findDependents(
  store: DependencyStore,
  key: string
): string[] {
  return Object.values(store.rules)
    .filter((rule) => rule.dependsOn.includes(key))
    .map((rule) => rule.key);
}

export function listAllDependencies(store: DependencyStore): DependencyRule[] {
  return Object.values(store.rules);
}
