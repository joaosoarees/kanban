import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  filterKey,
  isCardVisible,
  matchesFilter,
  NO_ASSIGNEE,
  NO_FILTER,
  parseBoardFilter,
  revealCard,
  takeFilterSnapshot,
  writeBoardFilter,
  type DueFilter,
  type FilterableCard,
} from "./board-filter";

const LABELS = ["bug", "ux", "api"];
const MEMBERS = ["ana", "bruno"];

function parse(query: string) {
  return parseBoardFilter(new URLSearchParams(query), LABELS, MEMBERS);
}

const TODAY = "2026-11-26";

function card(
  id: string,
  assigneeId: string | null,
  labelIds: string[],
  dueOn: string | null = null,
  completed = false,
): FilterableCard {
  return { id, assigneeId, labelIds, dueOn, completed };
}

describe("parseBoardFilter", () => {
  it("reads labels and assignee", () => {
    expect(parse("labels=bug,ux&assignee=ana&due=week")).toEqual({
      labelIds: ["bug", "ux"],
      assignee: "ana",
      due: "week",
    });
  });

  it("reads the no-assignee option", () => {
    expect(parse("assignee=none").assignee).toBe(NO_ASSIGNEE);
  });

  it("ignores unknown and repeated ids", () => {
    expect(parse("labels=bug,gone,bug,&assignee=left&due=later")).toEqual({
      labelIds: ["bug"],
      assignee: null,
      due: null,
    });
  });

  it("returns no filter without params", () => {
    expect(parse("card=1")).toEqual(NO_FILTER);
  });
});

describe("writeBoardFilter", () => {
  it("sets params and keeps the others", () => {
    const params = new URLSearchParams("card=1");
    writeBoardFilter(params, {
      labelIds: ["bug", "ux"],
      assignee: "ana",
      due: "overdue",
    });
    expect(params.toString()).toBe(
      "card=1&labels=bug%2Cux&assignee=ana&due=overdue",
    );
  });

  it("removes params when the filter is cleared", () => {
    const params = new URLSearchParams(
      "labels=bug&assignee=none&due=none&card=1",
    );
    writeBoardFilter(params, NO_FILTER);
    expect(params.toString()).toBe("card=1");
  });
});

describe("activeFilterCount", () => {
  it("counts each label and the assignee", () => {
    expect(
      activeFilterCount({
        labelIds: ["bug", "ux"],
        assignee: "ana",
        due: "week",
      }),
    ).toBe(4);
    expect(activeFilterCount(NO_FILTER)).toBe(0);
  });
});

describe("filterKey", () => {
  it("changes with the due filter", () => {
    expect(
      filterKey({ labelIds: [], assignee: null, due: "overdue" }, TODAY),
    ).not.toBe(filterKey({ labelIds: [], assignee: null, due: "week" }, TODAY));
  });

  it("changes with the day only for dated filters", () => {
    const overdue = { labelIds: [], assignee: null, due: "overdue" as const };
    expect(filterKey(overdue, TODAY)).not.toBe(filterKey(overdue, null));
    expect(filterKey(NO_FILTER, TODAY)).toBe(filterKey(NO_FILTER, null));
  });

  it("ignores label order", () => {
    expect(
      filterKey({ labelIds: ["ux", "bug"], assignee: null, due: null }, TODAY),
    ).toBe(
      filterKey({ labelIds: ["bug", "ux"], assignee: null, due: null }, TODAY),
    );
  });
});

describe("matchesFilter", () => {
  const assigned = card("1", "ana", ["bug", "api"]);
  const free = card("2", null, []);

  it("matches everything without a filter", () => {
    expect(matchesFilter(free, NO_FILTER, TODAY)).toBe(true);
  });

  it("matches any of the labels", () => {
    expect(
      matchesFilter(
        assigned,
        { labelIds: ["ux", "api"], assignee: null, due: null },
        TODAY,
      ),
    ).toBe(true);
    expect(
      matchesFilter(
        assigned,
        { labelIds: ["ux"], assignee: null, due: null },
        TODAY,
      ),
    ).toBe(false);
  });

  it("requires labels and assignee together", () => {
    expect(
      matchesFilter(
        assigned,
        { labelIds: ["bug"], assignee: "ana", due: null },
        TODAY,
      ),
    ).toBe(true);
    expect(
      matchesFilter(
        assigned,
        { labelIds: ["bug"], assignee: "bruno", due: null },
        TODAY,
      ),
    ).toBe(false);
    expect(
      matchesFilter(
        assigned,
        { labelIds: ["ux"], assignee: "ana", due: null },
        TODAY,
      ),
    ).toBe(false);
  });

  it("matches cards without assignee", () => {
    const filter = { labelIds: [], assignee: NO_ASSIGNEE, due: null };
    expect(matchesFilter(free, filter, TODAY)).toBe(true);
    expect(matchesFilter(assigned, filter, TODAY)).toBe(false);
  });
});

describe("matchesFilter by due date", () => {
  const late = card("1", null, [], "2026-11-20");
  const lateDone = card("2", null, [], "2026-11-20", true);
  const soon = card("3", null, [], "2026-12-03");
  const later = card("4", null, [], "2026-12-04");
  const undated = card("5", null, []);
  const cards = [late, lateDone, soon, later, undated];

  function shown(due: DueFilter, today: string | null = TODAY) {
    return cards
      .filter((each) =>
        matchesFilter(each, { labelIds: [], assignee: null, due }, today),
      )
      .map(({ id }) => id);
  }

  it("keeps overdue cards that are not done", () => {
    expect(shown("overdue")).toEqual(["1"]);
  });

  it("keeps cards due from today to seven days ahead", () => {
    expect(shown("week")).toEqual(["3"]);
  });

  it("keeps cards without a due date", () => {
    expect(shown("none")).toEqual(["5"]);
  });

  it("combines the due date with the other filters", () => {
    const ana = card("6", "ana", ["bug"], "2026-11-20");
    expect(
      matchesFilter(
        ana,
        { labelIds: ["bug"], assignee: "ana", due: "overdue" },
        TODAY,
      ),
    ).toBe(true);
    expect(
      matchesFilter(
        ana,
        { labelIds: ["ux"], assignee: "ana", due: "overdue" },
        TODAY,
      ),
    ).toBe(false);
  });

  it.each(["overdue", "week"] as const)(
    "matches no card with the %s filter before the viewer's day is known",
    (due) => {
      expect(shown(due, null)).toEqual([]);
    },
  );

  it("keeps cards without a due date before the viewer's day is known", () => {
    expect(shown("none", null)).toEqual(["5"]);
  });
});

describe("isCardVisible", () => {
  const filter = { labelIds: ["bug"], assignee: null, due: null };
  const snapshot = takeFilterSnapshot(
    [card("1", null, ["bug"]), card("2", null, ["ux"])],
    filter,
    TODAY,
  );

  it("keeps a card that stopped matching", () => {
    expect(isCardVisible(card("1", null, []), filter, snapshot, TODAY)).toBe(
      true,
    );
  });

  it("hides a known card that never matched", () => {
    expect(
      isCardVisible(card("2", null, ["ux"]), filter, snapshot, TODAY),
    ).toBe(false);
  });

  it("shows a known card that started matching", () => {
    expect(
      isCardVisible(card("2", null, ["bug"]), filter, snapshot, TODAY),
    ).toBe(true);
  });

  it("hides a new card from someone else that does not match", () => {
    expect(isCardVisible(card("3", null, []), filter, snapshot, TODAY)).toBe(
      false,
    );
  });

  it("shows a revealed card that does not match", () => {
    expect(
      isCardVisible(
        card("3", null, []),
        filter,
        revealCard(snapshot, "3"),
        TODAY,
      ),
    ).toBe(true);
  });
});
