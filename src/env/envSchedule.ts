/**
 * envSchedule.ts
 * Manages scheduled operations on vault entries — e.g. auto-rotate or auto-expire triggers.
 * Schedules are stored as cron-like descriptors with an associated action.
 */

export type ScheduleAction = 'rotate' | 'expire' | 'notify';

export interface ScheduleRecord {
  key: string;
  action: ScheduleAction;
  /** ISO 8601 date string for next scheduled run */
  nextRunAt: string;
  /** Optional repeat interval in seconds; undefined means run once */
  intervalSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleStore {
  schedules: Record<string, ScheduleRecord>;
}

/** Create an empty schedule store */
export function createEmptyScheduleStore(): ScheduleStore {
  return { schedules: {} };
}

/**
 * Build a compound key from an env key and action to allow multiple
 * schedules per key (e.g. both rotate and notify on the same key).
 */
function storeKey(key: string, action: ScheduleAction): string {
  return `${key}::${action}`;
}

/** Add or update a schedule for a given key and action */
export function setSchedule(
  store: ScheduleStore,
  key: string,
  action: ScheduleAction,
  nextRunAt: string,
  intervalSeconds?: number
): ScheduleStore {
  const now = new Date().toISOString();
  const sk = storeKey(key, action);
  const existing = store.schedules[sk];
  return {
    ...store,
    schedules: {
      ...store.schedules,
      [sk]: {
        key,
        action,
        nextRunAt,
        intervalSeconds,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      },
    },
  };
}

/** Remove a schedule for a given key and action */
export function removeSchedule(
  store: ScheduleStore,
  key: string,
  action: ScheduleAction
): ScheduleStore {
  const sk = storeKey(key, action);
  const { [sk]: _removed, ...rest } = store.schedules;
  return { ...store, schedules: rest };
}

/** Retrieve a schedule record, or undefined if not found */
export function getSchedule(
  store: ScheduleStore,
  key: string,
  action: ScheduleAction
): ScheduleRecord | undefined {
  return store.schedules[storeKey(key, action)];
}

/** Return all schedules that are due (nextRunAt <= now) */
export function getDueSchedules(
  store: ScheduleStore,
  now: Date = new Date()
): ScheduleRecord[] {
  return Object.values(store.schedules).filter(
    (r) => new Date(r.nextRunAt) <= now
  );
}

/** Advance a schedule to its next run time based on its interval, or remove it if one-shot */
export function advanceSchedule(
  store: ScheduleStore,
  key: string,
  action: ScheduleAction
): ScheduleStore {
  const record = getSchedule(store, key, action);
  if (!record) return store;

  if (record.intervalSeconds === undefined) {
    // One-shot: remove after firing
    return removeSchedule(store, key, action);
  }

  const next = new Date(
    new Date(record.nextRunAt).getTime() + record.intervalSeconds * 1000
  ).toISOString();

  return setSchedule(store, key, action, next, record.intervalSeconds);
}

/** List all schedules for a specific key */
export function listSchedulesForKey(
  store: ScheduleStore,
  key: string
): ScheduleRecord[] {
  return Object.values(store.schedules).filter((r) => r.key === key);
}
