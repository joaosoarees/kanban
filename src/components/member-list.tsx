"use client";

import { ChevronDown } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  changeRoleAction,
  removeMemberAction,
} from "@/app/(app)/w/[slug]/settings/actions";
import { rowButton } from "@/components/button-styles";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ROLE_LABELS, RoleBadge } from "@/components/role-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/generated/prisma/enums";
import { initialsOf } from "@/lib/initials";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { WorkspaceMember } from "@/lib/workspaces";

type AssignableRole = Exclude<Role, "OWNER">;

type OptimisticChange =
  | { type: "role"; userId: string; role: AssignableRole }
  | { type: "remove"; userId: string };

const ROLE_OPTIONS: { role: AssignableRole; description: string }[] = [
  {
    role: "ADMIN",
    description: "Adiciona e remove membros e renomeia o workspace.",
  },
  { role: "MEMBER", description: "Usa os quadros do workspace." },
];

function applyChange(members: WorkspaceMember[], change: OptimisticChange) {
  if (change.type === "remove") {
    return members.filter(({ userId }) => userId !== change.userId);
  }
  return members.map((member) =>
    member.userId === change.userId ? { ...member, role: change.role } : member,
  );
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
    if (role === member.role) return;
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

  return (
    <section aria-labelledby="members-title">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="members-title" className="text-[15px] font-semibold">
          Membros
        </h2>
        <span className="text-[13px] text-muted-foreground">
          {optimisticMembers.length === 1
            ? "1 pessoa"
            : `${optimisticMembers.length} pessoas`}
        </span>
      </div>
      <ul className="divide-y rounded-xl border bg-white">
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
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-semibold text-brand-strong"
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
                {canChangeRole ? (
                  <RoleMenu
                    member={member}
                    onChange={(role) => changeRole(member, role)}
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
        description={`${removeTarget?.name ?? ""} perde o acesso aos quadros deste workspace. Dá para adicionar de novo depois.`}
        confirmLabel="Remover"
        pendingLabel="Removendo…"
        onConfirm={() => {
          if (removeTarget) remove(removeTarget);
        }}
      />
    </section>
  );
}

function RoleMenu({
  member,
  onChange,
}: {
  member: WorkspaceMember;
  onChange: (role: AssignableRole) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Papel de ${member.name}: ${ROLE_LABELS[member.role]}`}
        className="inline-flex h-9 w-28 cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white pr-2.5 pl-3 text-[13px] font-medium outline-none hover:bg-zinc-50 focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-zinc-100"
      >
        {ROLE_LABELS[member.role]}
        <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuRadioGroup
          value={member.role}
          onValueChange={(value) => onChange(value as AssignableRole)}
        >
          {ROLE_OPTIONS.map(({ role, description }) => (
            <DropdownMenuRadioItem
              key={role}
              value={role}
              closeOnClick
              className="cursor-pointer items-start rounded-md py-2 pr-8 pl-2"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                <span className="text-xs/snug text-muted-foreground">
                  {description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
