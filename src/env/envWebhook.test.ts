import {
  createEmptyWebhookStore,
  addWebhook,
  removeWebhook,
  getWebhook,
  updateWebhookEvents,
  listWebhooks,
  filterWebhooksByEvent,
} from './envWebhook';

describe('envWebhook', () => {
  it('creates an empty webhook store', () => {
    const store = createEmptyWebhookStore();
    expect(store.webhooks).toHaveLength(0);
  });

  it('adds a webhook', () => {
    const store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://example.com/hook', ['set']);
    expect(store.webhooks).toHaveLength(1);
    expect(store.webhooks[0].url).toBe('https://example.com/hook');
    expect(store.webhooks[0].events).toContain('set');
  });

  it('removes a webhook by id', () => {
    let store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://a.com', ['set']);
    store = removeWebhook(store, 'wh1');
    expect(store.webhooks).toHaveLength(0);
  });

  it('gets a webhook by id', () => {
    const store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://b.com', ['delete']);
    const record = getWebhook(store, 'wh1');
    expect(record).toBeDefined();
    expect(record!.url).toBe('https://b.com');
  });

  it('returns undefined for missing webhook', () => {
    expect(getWebhook(createEmptyWebhookStore(), 'missing')).toBeUndefined();
  });

  it('updates webhook events', () => {
    let store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://c.com', ['set']);
    store = updateWebhookEvents(store, 'wh1', ['set', 'rotate']);
    expect(getWebhook(store, 'wh1')!.events).toContain('rotate');
  });

  it('lists all webhooks', () => {
    let store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://d.com', ['set']);
    store = addWebhook(store, 'wh2', 'https://e.com', ['import']);
    expect(listWebhooks(store)).toHaveLength(2);
  });

  it('filters webhooks by event', () => {
    let store = addWebhook(createEmptyWebhookStore(), 'wh1', 'https://f.com', ['set']);
    store = addWebhook(store, 'wh2', 'https://g.com', ['delete']);
    const results = filterWebhooksByEvent(store, 'set');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('wh1');
  });
});
