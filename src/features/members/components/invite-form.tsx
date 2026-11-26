"use client";

import { Send } from "lucide-react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { TextField } from "@/components/text-field";
import { Label } from "@/components/ui/label";
import { RoleMenu } from "@/features/members/components/role-menu";
import { inviteMemberSchema } from "@/features/members/lib/schemas";
import { inviteMemberAction } from "@/features/members/server/invite-actions";
import { useActionForm } from "@/hooks/use-action-form";
import { cn } from "@/lib/utils";

const INVITE_FAILED = "Não foi possível enviar o convite. Tente de novo.";

export function InviteForm({ workspaceId }: { workspaceId: string }) {
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
    schema: inviteMemberSchema,
    defaultValues: { email: "", role: "MEMBER" },
    action: async (values) => inviteMemberAction(workspaceId, values),
    failure: INVITE_FAILED,
    onSuccess: ({ email, delivered }) => {
      reset();
      if (delivered) {
        toast.success(`Convite enviado para ${email}`);
        return;
      }
      toast.warning("O convite foi salvo, mas o e-mail não saiu.", {
        description: "Use “Reenviar” em instantes.",
      });
    },
  });

  return (
    <section
      aria-labelledby="invite-title"
      className="rounded-xl border bg-card p-5"
    >
      <h2 id="invite-title" className="text-[15px] font-semibold">
        Convidar
      </h2>
      <form onSubmit={submit} noValidate aria-busy={isPending} className="mt-4">
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0 sm:grid sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-start"
        >
          <TextField
            id="invite-email"
            type="email"
            required
            label="E-mail"
            placeholder="nome@empresa.com"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            hint="Enviamos um link que vale por 7 dias."
            error={errors.email?.message ?? errors.root?.message}
            {...register("email")}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="invite-role">Papel</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <RoleMenu
                  id="invite-role"
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
              pendingLabel="Enviando convite…"
              className={cn("h-10 px-4", primaryButton)}
            >
              <Send aria-hidden />
              Convidar
            </PendingButton>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
