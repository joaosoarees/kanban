import { describe, expect, it } from "vitest";
import {
  appendOlderActivities,
  refreshActivities,
  type ActivityPage,
  type CardActivity,
} from "./card-activity";

function makeActivity(id: string): CardActivity {
  return {
    id,
    type: "DESCRIPTION_CHANGED",
    actorName: "Ana Lima",
    createdAt: "2026-11-27T12:00:00.000Z",
    byViewer: false,
  };
}

function pageOf(ids: string[], nextCursor: string | null): ActivityPage {
  return { activities: ids.map((id) => makeActivity(id)), nextCursor };
}

describe("refreshActivities", () => {
  it("should put the new events on top and keep the cursor when the fresh page reaches the loaded ones", () => {
    const current = pageOf(["05", "04", "03"], "03");
    const fresh = pageOf(["07", "06", "05"], "05");

    const result = refreshActivities(current, fresh);

    expect(result).toEqual(pageOf(["07", "06", "05", "04", "03"], "03"));
  });

  it("should replace the list and the cursor when the fresh page ends after the newest loaded event", () => {
    const current = pageOf(["05", "04", "03"], "03");
    const fresh = pageOf(["09", "08", "07"], "07");

    const result = refreshActivities(current, fresh);

    expect(result).toEqual(fresh);
  });

  it("should keep the loaded events when the fresh page ends after them but has no older page", () => {
    const current = pageOf(["02", "01"], null);
    const fresh = pageOf(["04", "03"], null);

    const result = refreshActivities(current, fresh);

    expect(result).toEqual(pageOf(["04", "03", "02", "01"], null));
  });

  it("should take the fresh page when nothing was loaded before", () => {
    const current = pageOf([], null);
    const fresh = pageOf(["03", "02"], "02");

    const result = refreshActivities(current, fresh);

    expect(result).toEqual(fresh);
  });
});

describe("appendOlderActivities", () => {
  it("should add the older events below and take their cursor when the list still ends at the cursor", () => {
    const current = pageOf(["05", "04"], "04");
    const older = pageOf(["03", "02"], "02");

    const result = appendOlderActivities(current, "04", older);

    expect(result).toEqual(pageOf(["05", "04", "03", "02"], "02"));
  });

  it("should keep the list when a refresh replaced it while the older page loaded", () => {
    const current = pageOf(["09", "08"], "08");
    const older = pageOf(["03", "02"], "02");

    const result = appendOlderActivities(current, "04", older);

    expect(result).toEqual(current);
  });
});
