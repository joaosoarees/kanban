import { describe, expect, it } from "vitest";
import {
  finishWrite,
  IDLE_SYNC,
  markChanged,
  receiveList,
  startWrite,
} from "./checklist-sync";

describe("finishWrite", () => {
  it("should not reload when the last write was saved", () => {
    const sync = startWrite(IDLE_SYNC);

    const result = finishWrite(sync, true);

    expect(result).toEqual({
      sync: { pending: 0, changes: 2, stale: false },
      reload: false,
    });
  });

  it("should reload when the last write failed", () => {
    const sync = startWrite(IDLE_SYNC);

    const result = finishWrite(sync, false);

    expect(result).toEqual({
      sync: { pending: 0, changes: 2, stale: false },
      reload: true,
    });
  });

  it("should wait for the other pending writes before reloading after a failure", () => {
    const sync = startWrite(startWrite(IDLE_SYNC));

    const result = finishWrite(sync, false);

    expect(result).toEqual({
      sync: { pending: 1, changes: 3, stale: true },
      reload: false,
    });
  });

  it("should not reload when a write is saved while others are pending and none failed", () => {
    const sync = startWrite(startWrite(IDLE_SYNC));

    const result = finishWrite(sync, true);

    expect(result).toEqual({
      sync: { pending: 1, changes: 3, stale: false },
      reload: false,
    });
  });

  it("should keep the pending count at zero when no write was pending", () => {
    const result = finishWrite(IDLE_SYNC, true);

    expect(result).toEqual({
      sync: { pending: 0, changes: 1, stale: false },
      reload: false,
    });
  });

  it("should reload when the last write is saved after an earlier one failed", () => {
    const sync = { pending: 1, changes: 2, stale: true };

    const result = finishWrite(sync, true);

    expect(result).toEqual({
      sync: { pending: 0, changes: 3, stale: false },
      reload: true,
    });
  });
});

describe("receiveList", () => {
  it("should apply a fetched list when no write started while it was fetched", () => {
    const result = receiveList(IDLE_SYNC, IDLE_SYNC.changes);

    expect(result).toEqual({ sync: IDLE_SYNC, apply: true, reload: false });
  });

  it("should hold a fetched list and reload later when a write is pending", () => {
    const sync = startWrite(IDLE_SYNC);

    const result = receiveList(sync, sync.changes);

    expect(result).toEqual({
      sync: { pending: 1, changes: 1, stale: true },
      apply: false,
      reload: false,
    });
  });

  it("should hold a fetched list when a write started while it was fetched and is still pending", () => {
    const sentAt = IDLE_SYNC.changes;
    const sync = startWrite(IDLE_SYNC);

    const result = receiveList(sync, sentAt);

    expect(result).toEqual({
      sync: { pending: 1, changes: 1, stale: true },
      apply: false,
      reload: false,
    });
  });

  it("should reload now when a write started and finished while the list was fetched", () => {
    const sentAt = IDLE_SYNC.changes;
    const sync = finishWrite(startWrite(IDLE_SYNC), true).sync;

    const result = receiveList(sync, sentAt);

    expect(result).toEqual({ sync, apply: false, reload: true });
  });

  it("should reload now when a write in flight when the list was sent finished while it was fetched", () => {
    const sending = startWrite(IDLE_SYNC);
    const sync = finishWrite(sending, true).sync;

    const result = receiveList(sync, sending.changes);

    expect(result).toEqual({ sync, apply: false, reload: true });
  });

  it("should reload now when the list changed locally while it was fetched", () => {
    const sentAt = IDLE_SYNC.changes;
    const sync = markChanged(IDLE_SYNC);

    const result = receiveList(sync, sentAt);

    expect(result).toEqual({
      sync: { pending: 0, changes: 1, stale: false },
      apply: false,
      reload: true,
    });
  });
});
