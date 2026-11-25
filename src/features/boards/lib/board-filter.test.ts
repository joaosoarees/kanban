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
  type FilterableCard,
} from "./board-filter";

const LABELS = ["bug", "ux", "api"];
const MEMBERS = ["ana", "bruno"];

function parse(query: string) {
  return parseBoardFilter(new URLSearchParams(query), LABELS, MEMBERS);
}

function card(
  id: string,
  assigneeId: string | null,
  labelIds: string[],
): FilterableCard {
  return { id, assigneeId, labelIds };
}

describe("parseBoardFilter", () => {
  it("reads labels and assignee", () => {
    expect(parse("labels=bug,ux&assignee=ana")).toEqual({
      labelIds: ["bug", "ux"],
      assignee: "ana",
    });
  });

  it("reads the no-assignee option", () => {
    expect(parse("assignee=none").assignee).toBe(NO_ASSIGNEE);
  });

  it("ignores unknown and repeated ids", () => {
    expect(parse("labels=bug,gone,bug,&assignee=left")).toEqual({
      labelIds: ["bug"],
      assignee: null,
    });
  });

  it("returns no filter without params", () => {
    expect(parse("card=1")).toEqual(NO_FILTER);
  });
});

describe("writeBoardFilter", () => {
  it("sets params and keeps the others", () => {
    const params = new URLSearchParams("card=1");
    writeBoardFilter(params, { labelIds: ["bug", "ux"], assignee: "ana" });
    expect(params.toString()).toBe("card=1&labels=bug%2Cux&assignee=ana");
  });

  it("removes params when the filter is cleared", () => {
    const params = new URLSearchParams("labels=bug&assignee=none&card=1");
    writeBoardFilter(params, NO_FILTER);
    expect(params.toString()).toBe("card=1");
  });
});

describe("activeFilterCount", () => {
  it("counts each label and the assignee", () => {
    expect(
      activeFilterCount({ labelIds: ["bug", "ux"], assignee: "ana" }),
    ).toBe(3);
    expect(activeFilterCount(NO_FILTER)).toBe(0);
  });
});

describe("filterKey", () => {
  it("ignores label order", () => {
    expect(filterKey({ labelIds: ["ux", "bug"], assignee: null })).toBe(
      filterKey({ labelIds: ["bug", "ux"], assignee: null }),
    );
  });
});

describe("matchesFilter", () => {
  const assigned = card("1", "ana", ["bug", "api"]);
  const free = card("2", null, []);

  it("matches everything without a filter", () => {
    expect(matchesFilter(free, NO_FILTER)).toBe(true);
  });

  it("matches any of the labels", () => {
    expect(
      matchesFilter(assigned, { labelIds: ["ux", "api"], assignee: null }),
    ).toBe(true);
    expect(matchesFilter(assigned, { labelIds: ["ux"], assignee: null })).toBe(
      false,
    );
  });

  it("requires labels and assignee together", () => {
    expect(
      matchesFilter(assigned, { labelIds: ["bug"], assignee: "ana" }),
    ).toBe(true);
    expect(
      matchesFilter(assigned, { labelIds: ["bug"], assignee: "bruno" }),
    ).toBe(false);
    expect(matchesFilter(assigned, { labelIds: ["ux"], assignee: "ana" })).toBe(
      false,
    );
  });

  it("matches cards without assignee", () => {
    const filter = { labelIds: [], assignee: NO_ASSIGNEE };
    expect(matchesFilter(free, filter)).toBe(true);
    expect(matchesFilter(assigned, filter)).toBe(false);
  });
});

describe("isCardVisible", () => {
  const filter = { labelIds: ["bug"], assignee: null };
  const snapshot = takeFilterSnapshot(
    [card("1", null, ["bug"]), card("2", null, ["ux"])],
    filter,
  );

  it("keeps a card that stopped matching", () => {
    expect(isCardVisible(card("1", null, []), filter, snapshot)).toBe(true);
  });

  it("hides a known card that never matched", () => {
    expect(isCardVisible(card("2", null, ["ux"]), filter, snapshot)).toBe(
      false,
    );
  });

  it("shows a known card that started matching", () => {
    expect(isCardVisible(card("2", null, ["bug"]), filter, snapshot)).toBe(
      true,
    );
  });

  it("hides a new card from someone else that does not match", () => {
    expect(isCardVisible(card("3", null, []), filter, snapshot)).toBe(false);
  });

  it("shows a revealed card that does not match", () => {
    expect(
      isCardVisible(card("3", null, []), filter, revealCard(snapshot, "3")),
    ).toBe(true);
  });
});
