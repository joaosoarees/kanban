import type { Role } from "@/generated/prisma/enums";

export type WorkspaceAction =
  | "inviteMember"
  | "changeRole"
  | "removeMember"
  | "renameWorkspace"
  | "deleteWorkspace"
  | "leaveWorkspace"
  | "manageBoards"
  | "manageColumns"
  | "manageCards";

export type MemberTarget = { role: Role; isSelf: boolean };

type Rule = (actor: Role, target?: MemberTarget) => boolean;

const canManage: Rule = (actor) => actor === "OWNER" || actor === "ADMIN";

const canManageMember: Rule = (actor, target) => {
  if (!target || target.isSelf || target.role === "OWNER") {
    return false;
  }
  if (actor === "OWNER") {
    return true;
  }
  return actor === "ADMIN" && target.role === "MEMBER";
};

const RULES: Record<WorkspaceAction, Rule> = {
  inviteMember: canManage,
  renameWorkspace: canManage,
  deleteWorkspace: (actor) => actor === "OWNER",
  leaveWorkspace: (actor) => actor !== "OWNER",
  changeRole: canManageMember,
  removeMember: canManageMember,
  manageBoards: canManage,
  manageColumns: () => true,
  manageCards: () => true,
};

export function can(
  actor: Role,
  action: WorkspaceAction,
  target?: MemberTarget,
): boolean {
  return RULES[action](actor, target);
}
