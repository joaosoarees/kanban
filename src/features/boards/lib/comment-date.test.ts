import { describe, expect, it } from "vitest";
import { formatCommentDate } from "./comment-date";

const TODAY = "2026-11-26";

describe("formatCommentDate", () => {
  it.each([
    { instant: new Date(2026, 10, 26, 18, 30), expected: "hoje, 18h30" },
    { instant: new Date(2026, 10, 26, 0, 5), expected: "hoje, 0h05" },
    { instant: new Date(2026, 10, 25, 9, 12), expected: "ontem, 9h12" },
    { instant: new Date(2026, 10, 20, 18, 30), expected: "20/11, 18h30" },
    { instant: new Date(2026, 0, 3, 7, 0), expected: "03/01, 7h00" },
    { instant: new Date(2025, 10, 26, 18, 30), expected: "26/11/2025, 18h30" },
  ])("should write $expected", ({ instant, expected }) => {
    expect(formatCommentDate(instant, TODAY)).toBe(expected);
  });

  it("should call the last day of the previous year yesterday on new year's day", () => {
    expect(
      formatCommentDate(new Date(2026, 11, 31, 23, 50), "2027-01-01"),
    ).toBe("ontem, 23h50");
  });

  it("should write the full date before the viewer's day is known", () => {
    expect(formatCommentDate(new Date(2026, 10, 26, 18, 30), null)).toBe(
      "26/11/2026, 18h30",
    );
  });
});
