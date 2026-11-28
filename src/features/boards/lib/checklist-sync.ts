export type ChecklistSync = {
  pending: number;
  changes: number;
  stale: boolean;
};

export const IDLE_SYNC: ChecklistSync = {
  pending: 0,
  changes: 0,
  stale: false,
};

export function startWrite(sync: ChecklistSync): ChecklistSync {
  return { ...sync, pending: sync.pending + 1, changes: sync.changes + 1 };
}

export function markChanged(sync: ChecklistSync): ChecklistSync {
  return { ...sync, changes: sync.changes + 1 };
}

export function finishWrite(
  sync: ChecklistSync,
  saved: boolean,
): { sync: ChecklistSync; reload: boolean } {
  const pending = Math.max(0, sync.pending - 1);
  const changes = sync.changes + 1;
  const stale = sync.stale || !saved;
  if (pending === 0 && stale) {
    return { sync: { pending, changes, stale: false }, reload: true };
  }
  return { sync: { pending, changes, stale }, reload: false };
}

export function receiveList(
  sync: ChecklistSync,
  changesWhenSent: number,
): { sync: ChecklistSync; apply: boolean; reload: boolean } {
  if (sync.pending > 0) {
    return { sync: { ...sync, stale: true }, apply: false, reload: false };
  }
  if (sync.changes !== changesWhenSent) {
    return { sync, apply: false, reload: true };
  }
  return { sync, apply: true, reload: false };
}
