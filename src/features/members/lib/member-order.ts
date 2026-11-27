import type { Role } from "@/generated/prisma/enums";

const ROLE_ORDER: Record<Role, number> = { OWNER: 0, ADMIN: 1, MEMBER: 2 };

type ListedMember = { userId: string; name: string; role: Role };
type AssignableMember = { id: string; name: string; isViewer: boolean };

export function compareMembers(a: ListedMember, b: ListedMember): number {
  return (
    ROLE_ORDER[a.role] - ROLE_ORDER[b.role] ||
    a.name.localeCompare(b.name, "pt-BR") ||
    a.userId.localeCompare(b.userId)
  );
}

export function compareAssignableMembers(
  a: AssignableMember,
  b: AssignableMember,
): number {
  return (
    Number(b.isViewer) - Number(a.isViewer) ||
    a.name.localeCompare(b.name, "pt-BR") ||
    a.id.localeCompare(b.id)
  );
}
