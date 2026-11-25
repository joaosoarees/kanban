"use client";

import { UserPlus } from "lucide-react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { Label } from "@/components/ui/label";
import { RoleMenu } from "@/features/members/components/role-menu";
import { addMemberSchema } from "@/features/members/lib/schemas";
import { addMemberAction } from "@/features/members/server/actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const ADD_FAILED = "Não foi possível adicionar o membro. Tente de novo.";

export function AddMemberForm({ workspaceId }: { workspaceId: string }) {
  const {
    form: {
      register,
      control,
      reset,
      formState: { errors },
    },
    submit,
    isPending,
  } = useActionForm({
    schema: addMemberSchema,
    defaultValues: { email: "", role: "MEMBER" },
    action: async (values) => addMemberAction(workspaceId, values),
    failure: ADD_FAILED,
    onSuccess: (_, values) => {
      reset();
      toast.success(`${values.email} agora faz parte do workspace.`);
    },
  });

  return (
    <section
      aria-labelledby="add-member-title"
      className="rounded-xl border bg-card p-5"
    >
      <h2 id="add-member-title" className="text-[15px] font-semibold">
        Adicionar membro
      </h2>
      <form onSubmit={submit} noValidate aria-busy={isPending} className="mt-4">
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 sm:grid sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-start"
        >
          <TextField
            id="member-email"
            type="email"
            required
            label="E-mail"
            placeholder="nome@empresa.com"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            hint="A pessoa precisa ter uma conta no Kanbanary."
            error={errors.email?.message ?? errors.root?.message}
            {...register("email")}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="member-role">Papel</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleMenu
                  id="member-role"
                  label="Papel"
                  value={field.value}
                  onChange={field.onChange}
                  className="h-10 w-full text-sm"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span aria-hidden className="hidden h-3.5 sm:block" />
            <PendingButton
              type="submit"
              isPending={isPending}
              pendingLabel="Adicionando membro…"
              className={cn("h-10 px-4", primaryButton)}
            >
              <UserPlus aria-hidden />
              Adicionar
            </PendingButton>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
