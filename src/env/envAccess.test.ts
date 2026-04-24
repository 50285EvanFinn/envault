import {
  createEmptyAccessStore,
  setAccessRule,
  removeAccessRule,
  getAccessRule,
  isAccessAllowed,
  listAccessRules,
} from './envAccess';

describe('envAccess', () => {
  it('creates an empty access store', () => {
    const store = createEmptyAccessStore();
    expect(store.rules).toEqual({});
  });

  it('sets an access rule for a key', () => {
    const store = createEmptyAccessStore();
    const updated = setAccessRule(store, 'API_KEY', ['machine-1'], []);
    const rule = updated.rules['API_KEY'];
    expect(rule).toBeDefined();
    expect(rule.allowedMachines).toContain('machine-1');
    expect(rule.deniedMachines).toHaveLength(0);
    expect(rule.updatedAt).toBeTruthy();
  });

  it('removes an access rule', () => {
    let store = createEmptyAccessStore();
    store = setAccessRule(store, 'DB_PASS', [], ['machine-2']);
    store = removeAccessRule(store, 'DB_PASS');
    expect(store.rules['DB_PASS']).toBeUndefined();
  });

  it('gets an access rule by key', () => {
    let store = createEmptyAccessStore();
    store = setAccessRule(store, 'SECRET', ['m1', 'm2'], []);
    const rule = getAccessRule(store, 'SECRET');
    expect(rule?.allowedMachines).toEqual(['m1', 'm2']);
  });

  it('returns undefined for missing rule', () => {
    const store = createEmptyAccessStore();
    expect(getAccessRule(store, 'MISSING')).toBeUndefined();
  });

  it('allows access when no rule is defined', () => {
    const store = createEmptyAccessStore();
    expect(isAccessAllowed(store, 'ANY_KEY', 'machine-99')).toBe(true);
  });

  it('denies access for explicitly denied machine', () => {
    let store = createEmptyAccessStore();
    store = setAccessRule(store, 'KEY', [], ['machine-bad']);
    expect(isAccessAllowed(store, 'KEY', 'machine-bad')).toBe(false);
  });

  it('allows access for machine in allowedMachines', () => {
    let store = createEmptyAccessStore();
    store = setAccessRule(store, 'KEY', ['machine-ok'], []);
    expect(isAccessAllowed(store, 'KEY', 'machine-ok')).toBe(true);
  });

  it('denies access for machine not in allowedMachines', () => {
    let store = createEmptyAccessStore();
    store = setAccessRule(store, 'KEY', ['machine-ok'], []);
    expect(isAccessAllowed(store, 'KEY', 'machine-other')).toBe(false);
  });

  it('lists all access rules', () => {
    let store = createEmptyAccessStore();
    store = setAccessRule(store, 'A', ['m1'], []);
    store = setAccessRule(store, 'B', [], ['m2']);
    const list = listAccessRules(store);
    expect(list).toHaveLength(2);
    expect(list.map((r) => r.key)).toContain('A');
    expect(list.map((r) => r.key)).toContain('B');
  });
});
