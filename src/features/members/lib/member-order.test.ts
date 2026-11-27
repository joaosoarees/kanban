import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/enums";
import { compareAssignableMembers, compareMembers } from "./member-order";

function member(userId: string, name: string, role: Role) {
  return { userId, name, role };
}

function assignable(id: string, name: string, isViewer = false) {
  return { id, name, isViewer };
}

describe("compareMembers", () => {
  it("should list owners, then admins, then members", () => {
    const members = [
      member("u1", "Ana", "MEMBER"),
      member("u2", "Bruno", "OWNER"),
      member("u3", "Carla", "ADMIN"),
    ];

    const roles = members.toSorted(compareMembers).map(({ role }) => role);

    expect(roles).toEqual(["OWNER", "ADMIN", "MEMBER"]);
  });

  it("should order names within a role the Portuguese way", () => {
    const members = [
      member("u1", "Érica", "MEMBER"),
      member("u2", "eduardo", "MEMBER"),
      member("u3", "Fábio", "MEMBER"),
    ];

    const names = members.toSorted(compareMembers).map(({ name }) => name);

    expect(names).toEqual(["eduardo", "Érica", "Fábio"]);
  });

  it("should break a name tie by user id", () => {
    const members = [
      member("u2", "Ana", "ADMIN"),
      member("u1", "Ana", "ADMIN"),
    ];

    const ids = members.toSorted(compareMembers).map(({ userId }) => userId);

    expect(ids).toEqual(["u1", "u2"]);
  });
});

describe("compareAssignableMembers", () => {
  it("should put the viewer first", () => {
    const members = [assignable("u1", "Ana"), assignable("u2", "Zeca", true)];

    const ids = members.toSorted(compareAssignableMembers).map(({ id }) => id);

    expect(ids).toEqual(["u2", "u1"]);
  });

  it("should order the others by name the Portuguese way", () => {
    const members = [
      assignable("u1", "Érica"),
      assignable("u2", "eduardo"),
      assignable("u3", "Fábio"),
    ];

    const names = members
      .toSorted(compareAssignableMembers)
      .map(({ name }) => name);

    expect(names).toEqual(["eduardo", "Érica", "Fábio"]);
  });

  it("should break a name tie by id", () => {
    const members = [assignable("u2", "Ana"), assignable("u1", "Ana")];

    const ids = members.toSorted(compareAssignableMembers).map(({ id }) => id);

    expect(ids).toEqual(["u1", "u2"]);
  });
});
