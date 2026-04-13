import { EnvEntry } from './envEntry';

export interface HistoryRecord {
  key: string;
  previousValue: string | undefined;
  newValue: string | undefined;
  action: 'set' | 'delete' | 'rename' | 'rotate';
  timestamp: number;
}

export interface VaultHistory {
  records: HistoryRecord[];
}

export function createHistoryRecord(
  key: string,
  action: HistoryRecord['action'],
  previousValue?: string,
  newValue?: string
): HistoryRecord {
  return {
    key,
    previousValue,
    newValue,
    action,
    timestamp: Date.now(),
  };
}

export function appendHistory(
  history: VaultHistory,
  record: HistoryRecord,
  maxRecords = 100
): VaultHistory {
  const records = [record, ...history.records].slice(0, maxRecords);
  return { records };
}

export function filterHistoryByKey(
  history: VaultHistory,
  key: string
): HistoryRecord[] {
  return history.records.filter((r) => r.key === key);
}

export function filterHistoryByAction(
  history: VaultHistory,
  action: HistoryRecord['action']
): HistoryRecord[] {
  return history.records.filter((r) => r.action === action);
}

export function createEmptyHistory(): VaultHistory {
  return { records: [] };
}
