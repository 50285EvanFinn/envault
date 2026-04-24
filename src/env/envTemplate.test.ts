import {
  createEmptyTemplateStore,
  createTemplate,
  addTemplate,
  removeTemplate,
  getTemplate,
  listTemplates,
  validateAgainstTemplate,
  applyTemplateDefaults,
} from './envTemplate';

describe('envTemplate', () => {
  const variables = [
    { key: 'DB_HOST', required: true, description: 'Database host' },
    { key: 'DB_PORT', required: false, defaultValue: '5432' },
    { key: 'API_KEY', required: true },
  ];

  it('creates an empty template store', () => {
    const store = createEmptyTemplateStore();
    expect(store.templates).toEqual({});
  });

  it('creates a template with timestamps', () => {
    const t = createTemplate('base', variables, 'Base config');
    expect(t.name).toBe('base');
    expect(t.variables).toHaveLength(3);
    expect(t.createdAt).toBeDefined();
    expect(t.updatedAt).toBeDefined();
  });

  it('adds a template to the store', () => {
    let store = createEmptyTemplateStore();
    const t = createTemplate('base', variables);
    store = addTemplate(store, t);
    expect(store.templates['base']).toEqual(t);
  });

  it('removes a template from the store', () => {
    let store = createEmptyTemplateStore();
    store = addTemplate(store, createTemplate('base', variables));
    store = removeTemplate(store, 'base');
    expect(store.templates['base']).toBeUndefined();
  });

  it('gets a template by name', () => {
    let store = createEmptyTemplateStore();
    const t = createTemplate('base', variables);
    store = addTemplate(store, t);
    expect(getTemplate(store, 'base')).toEqual(t);
    expect(getTemplate(store, 'missing')).toBeUndefined();
  });

  it('lists all templates', () => {
    let store = createEmptyTemplateStore();
    store = addTemplate(store, createTemplate('a', []));
    store = addTemplate(store, createTemplate('b', []));
    expect(listTemplates(store)).toHaveLength(2);
  });

  it('validates required keys against entries', () => {
    const t = createTemplate('base', variables);
    const missing = validateAgainstTemplate(t, { DB_HOST: 'localhost' });
    expect(missing).toContain('API_KEY');
    expect(missing).not.toContain('DB_HOST');
    expect(missing).not.toContain('DB_PORT');
  });

  it('returns no missing keys when all required keys provided', () => {
    const t = createTemplate('base', variables);
    const missing = validateAgainstTemplate(t, { DB_HOST: 'localhost', API_KEY: 'key' });
    expect(missing).toHaveLength(0);
  });

  it('applies default values to entries', () => {
    const t = createTemplate('base', variables);
    const result = applyTemplateDefaults(t, { DB_HOST: 'localhost', API_KEY: 'abc' });
    expect(result['DB_PORT']).toBe('5432');
    expect(result['DB_HOST']).toBe('localhost');
  });

  it('does not override existing values with defaults', () => {
    const t = createTemplate('base', variables);
    const result = applyTemplateDefaults(t, { DB_HOST: 'h', API_KEY: 'k', DB_PORT: '3306' });
    expect(result['DB_PORT']).toBe('3306');
  });

  it('handles template without description', () => {
    const t = createTemplate('minimal', []);
    expect(t.description).toBeUndefined();
  });
});
