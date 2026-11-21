import { describe, expect, it } from "vitest";
import { can } from "./permissions";

const owner = { role: "OWNER", isSelf: false } as const;
const admin = { role: "ADMIN", isSelf: false } as const;
const member = { role: "MEMBER", isSelf: false } as const;

describe("can", () => {
  it("lets owners and admins manage boards, but not members", () => {
    expect(can("OWNER", "manageBoards")).toBe(true);
    expect(can("ADMIN", "manageBoards")).toBe(true);
    expect(can("MEMBER", "manageBoards")).toBe(false);
  });

  it("lets every role manage columns", () => {
    expect(can("OWNER", "manageColumns")).toBe(true);
    expect(can("ADMIN", "manageColumns")).toBe(true);
    expect(can("MEMBER", "manageColumns")).toBe(true);
  });

  it("lets owners and admins add members and rename, but not members", () => {
    expect(can("OWNER", "addMember")).toBe(true);
    expect(can("ADMIN", "addMember")).toBe(true);
    expect(can("MEMBER", "addMember")).toBe(false);
    expect(can("ADMIN", "renameWorkspace")).toBe(true);
    expect(can("MEMBER", "renameWorkspace")).toBe(false);
  });

  it("lets only the owner delete the workspace", () => {
    expect(can("OWNER", "deleteWorkspace")).toBe(true);
    expect(can("ADMIN", "deleteWorkspace")).toBe(false);
    expect(can("MEMBER", "deleteWorkspace")).toBe(false);
  });

  it("lets everyone but the owner leave", () => {
    expect(can("OWNER", "leaveWorkspace")).toBe(false);
    expect(can("ADMIN", "leaveWorkspace")).toBe(true);
    expect(can("MEMBER", "leaveWorkspace")).toBe(true);
  });

  it("lets the owner change any other role and admins only members' roles", () => {
    expect(can("OWNER", "changeRole", admin)).toBe(true);
    expect(can("OWNER", "changeRole", member)).toBe(true);
    expect(can("ADMIN", "changeRole", member)).toBe(true);
    expect(can("ADMIN", "changeRole", admin)).toBe(false);
    expect(can("MEMBER", "changeRole", member)).toBe(false);
  });

  it("never changes the owner's role or the actor's own role", () => {
    expect(can("ADMIN", "changeRole", owner)).toBe(false);
    expect(can("OWNER", "changeRole", { role: "OWNER", isSelf: true })).toBe(
      false,
    );
    expect(can("ADMIN", "changeRole", { role: "ADMIN", isSelf: true })).toBe(
      false,
    );
  });

  it("lets the owner remove anyone else and admins remove only members", () => {
    expect(can("OWNER", "removeMember", admin)).toBe(true);
    expect(can("OWNER", "removeMember", member)).toBe(true);
    expect(can("ADMIN", "removeMember", member)).toBe(true);
    expect(can("ADMIN", "removeMember", admin)).toBe(false);
    expect(can("ADMIN", "removeMember", owner)).toBe(false);
    expect(can("MEMBER", "removeMember", member)).toBe(false);
  });

  it("never removes the actor through removeMember", () => {
    expect(can("OWNER", "removeMember", { role: "OWNER", isSelf: true })).toBe(
      false,
    );
    expect(can("ADMIN", "removeMember", { role: "ADMIN", isSelf: true })).toBe(
      false,
    );
  });

  it("refuses target-based actions without a target", () => {
    expect(can("OWNER", "changeRole")).toBe(false);
    expect(can("OWNER", "removeMember")).toBe(false);
  });
});
