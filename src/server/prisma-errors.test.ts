import { describe, expect, it } from "vitest";
import {
  isForeignKeyViolation,
  isUniqueViolation,
  isWriteConflict,
} from "./prisma-errors";

function foreignKeyError(index: string) {
  return {
    code: "P2003",
    meta: { driverAdapterError: { cause: { constraint: { index } } } },
  };
}

describe("isUniqueViolation", () => {
  it("should recognise a P2002 error", () => {
    expect(isUniqueViolation({ code: "P2002" })).toBe(true);
  });

  it.each([{ code: "P2003" }, null, "P2002", new Error("P2002")])(
    "should refuse anything else: %j",
    (error) => {
      expect(isUniqueViolation(error)).toBe(false);
    },
  );
});

describe("isForeignKeyViolation", () => {
  it("should recognise a P2003 error on the given constraint", () => {
    const error = foreignKeyError("cards_assigneeId_fkey");

    expect(isForeignKeyViolation(error, "cards_assigneeId_fkey")).toBe(true);
  });

  it("should refuse a P2003 error on another constraint", () => {
    const error = foreignKeyError("cards_columnId_fkey");

    expect(isForeignKeyViolation(error, "cards_assigneeId_fkey")).toBe(false);
  });

  it("should refuse a P2003 error without the constraint in its meta", () => {
    const error = { code: "P2003", meta: { field_name: "assigneeId" } };

    expect(isForeignKeyViolation(error, "cards_assigneeId_fkey")).toBe(false);
  });

  it("should refuse another code that names the constraint", () => {
    const error = {
      ...foreignKeyError("cards_assigneeId_fkey"),
      code: "P2002",
    };

    expect(isForeignKeyViolation(error, "cards_assigneeId_fkey")).toBe(false);
  });
});

describe("isWriteConflict", () => {
  it.each(["40P01", "40001"])(
    "should recognise the SQLSTATE %s in the meta of a failed query",
    (originalCode) => {
      const error = {
        code: "P2010",
        meta: { driverAdapterError: { cause: { originalCode } } },
      };

      expect(isWriteConflict(error)).toBe(true);
    },
  );

  it("should recognise a P2034 error", () => {
    expect(isWriteConflict({ code: "P2034" })).toBe(true);
  });

  it("should recognise a conflict raised by the commit itself", () => {
    const error = {
      name: "DriverAdapterError",
      cause: { originalCode: "40P01" },
    };

    expect(isWriteConflict(error)).toBe(true);
  });

  it.each([
    {
      code: "P2010",
      meta: { driverAdapterError: { cause: { originalCode: "23505" } } },
    },
    { code: "P2002" },
    { cause: { originalCode: "23503" } },
    null,
    "40P01",
  ])("should refuse anything else: %j", (error) => {
    expect(isWriteConflict(error)).toBe(false);
  });
});
