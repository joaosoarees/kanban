import { describe, expect, it } from "vitest";
import {
  addDays,
  dueStatus,
  formatDueDay,
  isDueThisWeek,
  isOverdue,
  localDay,
} from "./card-due";

const TODAY = "2026-11-26";

function due(dueOn: string | null, completed = false) {
  return { dueOn, completed };
}

describe("localDay", () => {
  it("uses the local calendar day, not the UTC one", () => {
    expect(localDay(new Date(2026, 10, 26, 23, 30))).toBe("2026-11-26");
    expect(localDay(new Date(2026, 0, 5, 0, 10))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("crosses months, years and leap days", () => {
    expect(addDays("2026-11-26", 7)).toBe("2026-12-03");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("dueStatus", () => {
  it("has no status without a due date unless the card is done", () => {
    expect(dueStatus(due(null), TODAY)).toBeNull();
    expect(dueStatus(due(null, true), TODAY)).toBe("done");
  });

  it("compares the due date with today", () => {
    expect(dueStatus(due("2026-11-25"), TODAY)).toBe("overdue");
    expect(dueStatus(due("2026-11-26"), TODAY)).toBe("today");
    expect(dueStatus(due("2026-11-27"), TODAY)).toBe("upcoming");
    expect(dueStatus(due("2025-12-31"), TODAY)).toBe("overdue");
  });

  it("never marks a done card as overdue", () => {
    expect(dueStatus(due("2026-11-01", true), TODAY)).toBe("done");
  });

  it("stays neutral before the viewer's day is known", () => {
    expect(dueStatus(due("2020-01-01"), null)).toBe("upcoming");
  });
});

describe("formatDueDay", () => {
  it("drops the year inside the current one", () => {
    expect(formatDueDay("2026-11-12", TODAY)).toBe("12 nov");
    expect(formatDueDay("2026-01-03", TODAY)).toBe("3 jan");
  });

  it("shows the year outside the current one", () => {
    expect(formatDueDay("2027-11-12", TODAY)).toBe("12 nov 2027");
    expect(formatDueDay("2025-12-31", TODAY)).toBe("31 dez 2025");
  });
});

describe("isOverdue and isDueThisWeek", () => {
  it("counts overdue cards that are not done", () => {
    expect(isOverdue(due("2026-11-25"), TODAY)).toBe(true);
    expect(isOverdue(due("2026-11-25", true), TODAY)).toBe(false);
    expect(isOverdue(due("2026-11-26"), TODAY)).toBe(false);
  });

  it("takes the week from today to seven days ahead, without done cards", () => {
    expect(isDueThisWeek(due("2026-11-26"), TODAY)).toBe(true);
    expect(isDueThisWeek(due("2026-12-03"), TODAY)).toBe(true);
    expect(isDueThisWeek(due("2026-12-04"), TODAY)).toBe(false);
    expect(isDueThisWeek(due("2026-11-25"), TODAY)).toBe(false);
    expect(isDueThisWeek(due("2026-11-28", true), TODAY)).toBe(false);
    expect(isDueThisWeek(due(null), TODAY)).toBe(false);
  });
});
