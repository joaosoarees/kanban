export type ChecklistSync = {
  pending: number;
  started: number;
  stale: boolean;
};

export const IDLE_SYNC: ChecklistSync = {
  pending: 0,
  started: 0,
  stale: false,
};

export function startWrite(sync: ChecklistSync): ChecklistSync {
  return { ...sync, pending: sync.pending + 1, started: sync.started + 1 };
}

export function markChanged(sync: ChecklistSync): ChecklistSync {
  return { ...sync, started: sync.started + 1 };
}

export function finishWrite(
  sync: ChecklistSync,
  saved: boolean,
): { sync: ChecklistSync; reload: boolean } {
  const pending = Math.max(0, sync.pending - 1);
  const stale = sync.stale || !saved;
  if (pending === 0 && stale) {
    return { sync: { ...sync, pending, stale: false }, reload: true };
  }
  return { sync: { ...sync, pending, stale }, reload: false };
}

export function receiveList(
  sync: ChecklistSync,
  startedWhenSent: number,
): { sync: ChecklistSync; apply: boolean; reload: boolean } {
  if (sync.pending > 0) {
    return { sync: { ...sync, stale: true }, apply: false, reload: false };
  }
  if (sync.started !== startedWhenSent) {
    return { sync, apply: false, reload: true };
  }
  return { sync, apply: true, reload: false };
}
