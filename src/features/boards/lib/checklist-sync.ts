export type ChecklistSync = { pending: number; stale: boolean };

export const IDLE_SYNC: ChecklistSync = { pending: 0, stale: false };

export function startWrite(sync: ChecklistSync): ChecklistSync {
  return { ...sync, pending: sync.pending + 1 };
}

export function finishWrite(
  sync: ChecklistSync,
  saved: boolean,
): { sync: ChecklistSync; reload: boolean } {
  const pending = Math.max(0, sync.pending - 1);
  const stale = sync.stale || !saved;
  if (pending === 0 && stale) {
    return { sync: IDLE_SYNC, reload: true };
  }
  return { sync: { pending, stale }, reload: false };
}

export function receiveList(sync: ChecklistSync): {
  sync: ChecklistSync;
  apply: boolean;
} {
  if (sync.pending === 0) {
    return { sync, apply: true };
  }
  return { sync: { ...sync, stale: true }, apply: false };
}
