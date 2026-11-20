import type { Role } from "@/generated/prisma/enums";

export type WorkspaceAction =
  | "addMember"
  | "changeRole"
  | "removeMember"
  | "renameWorkspace"
  | "deleteWorkspace"
  | "leaveWorkspace";

export type MemberTarget = { role: Role; isSelf: boolean };

export function can(
  actor: Role,
  action: WorkspaceAction,
  target?: MemberTarget,
): boolean {
  switch (action) {
    case "addMember":
    case "renameWorkspace":
      return actor === "OWNER" || actor === "ADMIN";
    case "deleteWorkspace":
      return actor === "OWNER";
    case "leaveWorkspace":
      return actor !== "OWNER";
    case "changeRole":
    case "removeMember":
      if (!target || target.isSelf || target.role === "OWNER") return false;
      if (actor === "OWNER") return true;
      return actor === "ADMIN" && target.role === "MEMBER";
  }
}
