export type AuditAction =
  | 'read'
  | 'write'
  | 'delete'
  | 'export'
  | 'import'
  | 'rotate'
  | 'lock'
  | 'unlock';

export interface AuditRecord {
  key: string;
  action: AuditAction;
  timestamp: string;
  success: boolean;
  metadata?: Record<string, string>;
}

export interface AuditStore {
  records: AuditRecord[];
}

export function createEmptyAuditStore(): AuditStore {
  return { records: [] };
}

export function createAuditRecord(
  key: string,
  action: AuditAction,
  success: boolean,
  metadata?: Record<string, string>
): AuditRecord {
  return {
    key,
    action,
    timestamp: new Date().toISOString(),
    success,
    metadata,
  };
}

export function appendAuditRecord(
  store: AuditStore,
  record: AuditRecord
): AuditStore {
  return { records: [...store.records, record] };
}

export function filterAuditByKey(
  store: AuditStore,
  key: string
): AuditRecord[] {
  return store.records.filter((r) => r.key === key);
}

export function filterAuditByAction(
  store: AuditStore,
  action: AuditAction
): AuditRecord[] {
  return store.records.filter((r) => r.action === action);
}

export function getRecentAuditRecords(
  store: AuditStore,
  limit: number
): AuditRecord[] {
  return store.records.slice(-limit);
}

export function clearAuditStore(): AuditStore {
  return createEmptyAuditStore();
}
