import { describe, expect, it } from "vitest";
import {
  finishWrite,
  IDLE_SYNC,
  receiveList,
  startWrite,
} from "./checklist-sync";

describe("finishWrite", () => {
  it("should not reload when the last write was saved", () => {
    const sync = startWrite(IDLE_SYNC);

    const result = finishWrite(sync, true);

    expect(result).toEqual({ sync: IDLE_SYNC, reload: false });
  });

  it("should reload when the last write failed", () => {
    const sync = startWrite(IDLE_SYNC);

    const result = finishWrite(sync, false);

    expect(result).toEqual({ sync: IDLE_SYNC, reload: true });
  });

  it("should wait for the other pending writes before reloading after a failure", () => {
    const sync = startWrite(startWrite(IDLE_SYNC));

    const result = finishWrite(sync, false);

    expect(result).toEqual({
      sync: { pending: 1, stale: true },
      reload: false,
    });
  });

  it("should reload when the last write is saved after an earlier one failed", () => {
    const sync = { pending: 1, stale: true };

    const result = finishWrite(sync, true);

    expect(result).toEqual({ sync: IDLE_SYNC, reload: true });
  });
});

describe("receiveList", () => {
  it("should apply a fetched list when no write is pending", () => {
    const result = receiveList(IDLE_SYNC);

    expect(result).toEqual({ sync: IDLE_SYNC, apply: true });
  });

  it("should hold a fetched list and reload later when a write is pending", () => {
    const sync = startWrite(IDLE_SYNC);

    const result = receiveList(sync);

    expect(result).toEqual({
      sync: { pending: 1, stale: true },
      apply: false,
    });
  });
});
