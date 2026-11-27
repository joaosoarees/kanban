import { describe, expect, it } from "vitest";
import { can } from "./permissions";

const owner = { role: "OWNER", isSelf: false } as const;
const admin = { role: "ADMIN", isSelf: false } as const;
const member = { role: "MEMBER", isSelf: false } as const;

describe("can", () => {
  it("should let owners and admins manage boards, but not members", () => {
    expect(can("OWNER", "manageBoards")).toBe(true);
    expect(can("ADMIN", "manageBoards")).toBe(true);
    expect(can("MEMBER", "manageBoards")).toBe(false);
  });

  it("should let every role manage columns", () => {
    expect(can("OWNER", "manageColumns")).toBe(true);
    expect(can("ADMIN", "manageColumns")).toBe(true);
    expect(can("MEMBER", "manageColumns")).toBe(true);
  });

  it("should let every role manage cards", () => {
    expect(can("OWNER", "manageCards")).toBe(true);
    expect(can("ADMIN", "manageCards")).toBe(true);
    expect(can("MEMBER", "manageCards")).toBe(true);
  });

  it("should let owners and admins delete comments from others, but not members", () => {
    expect(can("OWNER", "deleteAnyComment")).toBe(true);
    expect(can("ADMIN", "deleteAnyComment")).toBe(true);
    expect(can("MEMBER", "deleteAnyComment")).toBe(false);
  });

  it("should let owners and admins invite members and rename, but not members", () => {
    expect(can("OWNER", "inviteMember")).toBe(true);
    expect(can("ADMIN", "inviteMember")).toBe(true);
    expect(can("MEMBER", "inviteMember")).toBe(false);
    expect(can("ADMIN", "renameWorkspace")).toBe(true);
    expect(can("MEMBER", "renameWorkspace")).toBe(false);
  });

  it("should let only the owner delete the workspace", () => {
    expect(can("OWNER", "deleteWorkspace")).toBe(true);
    expect(can("ADMIN", "deleteWorkspace")).toBe(false);
    expect(can("MEMBER", "deleteWorkspace")).toBe(false);
  });

  it("should let everyone but the owner leave", () => {
    expect(can("OWNER", "leaveWorkspace")).toBe(false);
    expect(can("ADMIN", "leaveWorkspace")).toBe(true);
    expect(can("MEMBER", "leaveWorkspace")).toBe(true);
  });

  it("should let the owner change any other role and admins only members' roles", () => {
    expect(can("OWNER", "changeRole", admin)).toBe(true);
    expect(can("OWNER", "changeRole", member)).toBe(true);
    expect(can("ADMIN", "changeRole", member)).toBe(true);
    expect(can("ADMIN", "changeRole", admin)).toBe(false);
    expect(can("MEMBER", "changeRole", member)).toBe(false);
  });

  it("should never change the owner's role or the actor's own role", () => {
    expect(can("ADMIN", "changeRole", owner)).toBe(false);
    expect(can("OWNER", "changeRole", { role: "OWNER", isSelf: true })).toBe(
      false,
    );
    expect(can("ADMIN", "changeRole", { role: "ADMIN", isSelf: true })).toBe(
      false,
    );
  });

  it("should let the owner remove anyone else and admins remove only members", () => {
    expect(can("OWNER", "removeMember", admin)).toBe(true);
    expect(can("OWNER", "removeMember", member)).toBe(true);
    expect(can("ADMIN", "removeMember", member)).toBe(true);
    expect(can("ADMIN", "removeMember", admin)).toBe(false);
    expect(can("ADMIN", "removeMember", owner)).toBe(false);
    expect(can("MEMBER", "removeMember", member)).toBe(false);
  });

  it("should never remove the actor through removeMember", () => {
    expect(can("OWNER", "removeMember", { role: "OWNER", isSelf: true })).toBe(
      false,
    );
    expect(can("ADMIN", "removeMember", { role: "ADMIN", isSelf: true })).toBe(
      false,
    );
  });

  it("should refuse target-based actions without a target", () => {
    expect(can("OWNER", "changeRole")).toBe(false);
    expect(can("OWNER", "removeMember")).toBe(false);
  });
});
