import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addDays,
  dueStatus,
  formatDueDay,
  isDueThisWeek,
  isOverdue,
  localDay,
  msUntilTomorrow,
} from "./card-due";

const TODAY = "2026-11-26";

describe("localDay", () => {
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/Sao_Paulo";
  });

  afterAll(() => {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  });

  it.each([
    { instant: "2026-11-27T02:30:00Z", expected: "2026-11-26" },
    { instant: "2026-01-05T02:10:00Z", expected: "2026-01-04" },
    { instant: "2026-01-05T03:10:00Z", expected: "2026-01-05" },
  ])(
    "should read $expected from the local clock at $instant",
    ({ instant, expected }) => {
      const day = localDay(new Date(instant));

      expect(day).toBe(expected);
    },
  );
});

describe("addDays", () => {
  it.each([
    { day: "2026-11-26", days: 7, expected: "2026-12-03" },
    { day: "2026-12-30", days: 3, expected: "2027-01-02" },
    { day: "2028-02-28", days: 1, expected: "2028-02-29" },
    { day: "2026-03-01", days: -1, expected: "2026-02-28" },
  ])("moves $day by $days days to $expected", ({ day, days, expected }) => {
    const shifted = addDays(day, days);

    expect(shifted).toBe(expected);
  });
});

describe("dueStatus", () => {
  it.each([
    { dueOn: "2026-11-25", expected: "overdue" },
    { dueOn: "2025-12-31", expected: "overdue" },
    { dueOn: "2026-11-26", expected: "today" },
    { dueOn: "2026-11-27", expected: "upcoming" },
  ])("is $expected for a card due on $dueOn", ({ dueOn, expected }) => {
    const status = dueStatus({ dueOn, completed: false }, TODAY);

    expect(status).toBe(expected);
  });

  it("has no status without a due date", () => {
    const status = dueStatus({ dueOn: null, completed: false }, TODAY);

    expect(status).toBeNull();
  });

  it.each([null, "2026-11-01"])(
    "is done for a completed card due on %s",
    (dueOn) => {
      const status = dueStatus({ dueOn, completed: true }, TODAY);

      expect(status).toBe("done");
    },
  );

  it("stays upcoming before the viewer's day is known", () => {
    const status = dueStatus({ dueOn: "2020-01-01", completed: false }, null);

    expect(status).toBe("upcoming");
  });
});

describe("formatDueDay", () => {
  it.each([
    { dueOn: "2026-11-12", expected: "12 nov" },
    { dueOn: "2026-01-03", expected: "3 jan" },
    { dueOn: "2027-11-12", expected: "12 nov 2027" },
    { dueOn: "2025-12-31", expected: "31 dez 2025" },
  ])("shows $dueOn as $expected", ({ dueOn, expected }) => {
    const label = formatDueDay(dueOn, TODAY);

    expect(label).toBe(expected);
  });
});

describe("isOverdue", () => {
  it.each([
    { dueOn: "2026-11-25", completed: false, expected: true },
    { dueOn: "2026-11-25", completed: true, expected: false },
    { dueOn: "2026-11-26", completed: false, expected: false },
  ])(
    "is $expected for due $dueOn and completed $completed",
    ({ dueOn, completed, expected }) => {
      const overdue = isOverdue({ dueOn, completed }, TODAY);

      expect(overdue).toBe(expected);
    },
  );
});

describe("isDueThisWeek", () => {
  it.each([
    { dueOn: "2026-11-26", completed: false, expected: true },
    { dueOn: "2026-12-03", completed: false, expected: true },
    { dueOn: "2026-12-04", completed: false, expected: false },
    { dueOn: "2026-11-25", completed: false, expected: false },
    { dueOn: "2026-11-28", completed: true, expected: false },
    { dueOn: null, completed: false, expected: false },
  ])(
    "is $expected for due $dueOn and completed $completed",
    ({ dueOn, completed, expected }) => {
      const dueSoon = isDueThisWeek({ dueOn, completed }, TODAY);

      expect(dueSoon).toBe(expected);
    },
  );
});

describe("msUntilTomorrow", () => {
  it("should wait until one second past the next local midnight", () => {
    const now = new Date(2026, 10, 26, 23, 59, 0);

    expect(msUntilTomorrow(now)).toBe(61_000);
  });

  it("should wait a whole day and one second from midnight itself", () => {
    const now = new Date(2026, 10, 26, 0, 0, 0);

    expect(msUntilTomorrow(now)).toBe(24 * 60 * 60 * 1000 + 1000);
  });
});

describe("msUntilTomorrow across a daylight saving change", () => {
  const originalTimezone = process.env.TZ;

  beforeAll(() => {
    process.env.TZ = "America/New_York";
  });

  afterAll(() => {
    if (originalTimezone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimezone;
    }
  });

  it("should wait 25 hours and one second on the day clocks fall back", () => {
    const now = new Date("2026-11-01T04:00:00Z");

    expect(msUntilTomorrow(now)).toBe(25 * 60 * 60 * 1000 + 1000);
  });
});
