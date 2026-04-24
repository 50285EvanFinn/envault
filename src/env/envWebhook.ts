export interface WebhookRecord {
  id: string;
  url: string;
  events: WebhookEvent[];
  createdAt: string;
  updatedAt: string;
}

export type WebhookEvent = 'set' | 'delete' | 'rotate' | 'import';

export interface WebhookStore {
  webhooks: WebhookRecord[];
}

export function createEmptyWebhookStore(): WebhookStore {
  return { webhooks: [] };
}

export function addWebhook(
  store: WebhookStore,
  id: string,
  url: string,
  events: WebhookEvent[]
): WebhookStore {
  const now = new Date().toISOString();
  const record: WebhookRecord = { id, url, events, createdAt: now, updatedAt: now };
  return { webhooks: [...store.webhooks, record] };
}

export function removeWebhook(store: WebhookStore, id: string): WebhookStore {
  return { webhooks: store.webhooks.filter((w) => w.id !== id) };
}

export function getWebhook(store: WebhookStore, id: string): WebhookRecord | undefined {
  return store.webhooks.find((w) => w.id === id);
}

export function updateWebhookEvents(
  store: WebhookStore,
  id: string,
  events: WebhookEvent[]
): WebhookStore {
  return {
    webhooks: store.webhooks.map((w) =>
      w.id === id ? { ...w, events, updatedAt: new Date().toISOString() } : w
    ),
  };
}

export function listWebhooks(store: WebhookStore): WebhookRecord[] {
  return store.webhooks;
}

export function filterWebhooksByEvent(
  store: WebhookStore,
  event: WebhookEvent
): WebhookRecord[] {
  return store.webhooks.filter((w) => w.events.includes(event));
}
