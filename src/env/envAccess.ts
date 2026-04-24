/**
 * envAccess.ts
 * Manages per-key access control: allowed/denied machine identifiers.
 */

export interface AccessRule {
  allowedMachines: string[];
  deniedMachines: string[];
  updatedAt: string;
}

export interface AccessStore {
  rules: Record<string, AccessRule>;
}

export function createEmptyAccessStore(): AccessStore {
  return { rules: {} };
}

export function setAccessRule(
  store: AccessStore,
  key: string,
  allowedMachines: string[],
  deniedMachines: string[]
): AccessStore {
  return {
    ...store,
    rules: {
      ...store.rules,
      [key]: {
        allowedMachines,
        deniedMachines,
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function removeAccessRule(store: AccessStore, key: string): AccessStore {
  const rules = { ...store.rules };
  delete rules[key];
  return { ...store, rules };
}

export function getAccessRule(store: AccessStore, key: string): AccessRule | undefined {
  return store.rules[key];
}

export function isAccessAllowed(
  store: AccessStore,
  key: string,
  machineId: string
): boolean {
  const rule = store.rules[key];
  if (!rule) return true;
  if (rule.deniedMachines.includes(machineId)) return false;
  if (rule.allowedMachines.length > 0) {
    return rule.allowedMachines.includes(machineId);
  }
  return true;
}

export function listAccessRules(store: AccessStore): Array<{ key: string } & AccessRule> {
  return Object.entries(store.rules).map(([key, rule]) => ({ key, ...rule }));
}
