"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  changeRoleAction,
  removeMemberAction,
} from "@/app/(app)/w/[slug]/settings/actions";
import { rowButton } from "@/components/button-styles";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RoleBadge } from "@/components/role-badge";
import {
  type AssignableRole,
  isAssignableRole,
  RoleMenu,
} from "@/components/role-menu";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/enums";
import { cardsLabel } from "@/lib/card-count";
import { initialsOf } from "@/lib/initials";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { WorkspaceMember } from "@/lib/workspaces";

type OptimisticChange =
  | { type: "role"; userId: string; role: AssignableRole }
  | { type: "remove"; userId: string };

function applyChange(members: WorkspaceMember[], change: OptimisticChange) {
  if (change.type === "remove") {
    return members.filter(({ userId }) => userId !== change.userId);
  }
  return members.map((member) =>
    member.userId === change.userId ? { ...member, role: change.role } : member,
  );
}

function removeDescription(member: WorkspaceMember | null) {
  const name = member?.name ?? "";
  const assigned = member?.assignedCards ?? 0;
  const loss =
    assigned === 0
      ? "perde o acesso aos quadros deste workspace"
      : `perde o acesso aos quadros e deixa de ser responsável por ${cardsLabel(assigned)}`;
  return `${name} ${loss}. Dá para adicionar de\u00A0novo\u00A0depois.`;
}

type MemberListProps = {
  workspaceId: string;
  members: WorkspaceMember[];
  viewer: { userId: string; role: Role };
};

export function MemberList({ workspaceId, members, viewer }: MemberListProps) {
  const [optimisticMembers, applyOptimistic] = useOptimistic(
    members,
    applyChange,
  );
  const [, startTransition] = useTransition();
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(
    null,
  );
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const changeRole = (member: WorkspaceMember, role: AssignableRole) => {
    if (role === member.role) {
      return;
    }
    startTransition(async () => {
      applyOptimistic({ type: "role", userId: member.userId, role });
      const result = await changeRoleAction(workspaceId, {
        userId: member.userId,
        role,
      });
      if (result.status === "error") {
        toast.error(`Não foi possível mudar o papel de ${member.name}.`, {
          description: `${result.message} A lista voltou ao que era.`,
        });
      }
    });
  };

  const remove = (member: WorkspaceMember) => {
    setIsRemoveOpen(false);
    startTransition(async () => {
      applyOptimistic({ type: "remove", userId: member.userId });
      const result = await removeMemberAction(workspaceId, {
        userId: member.userId,
      });
      if (result.status === "error") {
        toast.error(`Não foi possível remover ${member.name}.`, {
          description: `${result.message} A lista voltou ao que era.`,
        });
      }
    });
  };

  const confirmRemove = (): undefined => {
    if (removeTarget) {
      remove(removeTarget);
    }
  };

  return (
    <section aria-label="Membros">
      <ul className="divide-y rounded-xl border bg-card">
        {optimisticMembers.map((member) => {
          const target = {
            role: member.role,
            isSelf: member.userId === viewer.userId,
          };
          const canChangeRole = can(viewer.role, "changeRole", target);
          const canRemove = can(viewer.role, "removeMember", target);
          const showsControls =
            can(viewer.role, "addMember") || canChangeRole || canRemove;

          return (
            <li
              key={member.userId}
              className="flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-strong text-[13px] font-semibold text-brand-strong"
                >
                  {initialsOf(member.name)}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold">
                    {member.name}
                    {target.isSelf && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        (você)
                      </span>
                    )}
                  </span>
                  <span className="truncate text-[13px] text-muted-foreground">
                    {member.email}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "flex items-center gap-2 pl-12 sm:pl-0",
                  showsControls && "justify-between sm:justify-end",
                )}
              >
                {canChangeRole && isAssignableRole(member.role) ? (
                  <RoleMenu
                    label={`Papel de ${member.name}`}
                    value={member.role}
                    onChange={(role) => {
                      changeRole(member, role);
                    }}
                  />
                ) : (
                  <span className="inline-flex w-28">
                    <RoleBadge role={member.role} />
                  </span>
                )}
                {canRemove ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRemoveTarget(member);
                      setIsRemoveOpen(true);
                    }}
                    aria-label={`Remover ${member.name}`}
                    className={rowButton}
                  >
                    Remover
                  </Button>
                ) : (
                  showsControls && (
                    <span aria-hidden className="hidden w-[76px] sm:block" />
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={isRemoveOpen}
        onOpenChange={setIsRemoveOpen}
        title={`Remover ${removeTarget?.name ?? ""}?`}
        description={removeDescription(removeTarget)}
        confirmLabel="Remover"
        pendingLabel="Removendo…"
        onConfirm={confirmRemove}
      />
    </section>
  );
}
