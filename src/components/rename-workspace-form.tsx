"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import { renameWorkspaceAction } from "@/app/(app)/w/[slug]/settings/actions";
import { TextField } from "@/components/text-field";
import { Button } from "@/components/ui/button";
import { applyActionErrors } from "@/lib/form-errors";
import {
  renameWorkspaceSchema,
  WORKSPACE_NAME_MAX_LENGTH,
} from "@/lib/workspace-schemas";

type RenameInput = z.input<typeof renameWorkspaceSchema>;
type RenameOutput = z.output<typeof renameWorkspaceSchema>;

type RenameWorkspaceFormProps = {
  workspaceId: string;
  name: string;
  slug: string;
};

export function RenameWorkspaceForm({
  workspaceId,
  name,
  slug,
}: RenameWorkspaceFormProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<RenameInput, unknown, RenameOutput>({
    resolver: zodResolver(renameWorkspaceSchema),
    defaultValues: { name },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await renameWorkspaceAction(workspaceId, values);
      if (result.status === "error") {
        applyActionErrors(result, setError);
        return;
      }
      reset({ name: values.name });
      toast.success("Nome do workspace atualizado.");
    });
  });

  return (
    <section
      aria-labelledby="rename-title"
      className="rounded-xl border bg-white p-5"
    >
      <h2 id="rename-title" className="text-[15px] font-semibold">
        Nome do workspace
      </h2>
      <form
        onSubmit={onSubmit}
        noValidate
        aria-busy={isPending}
        className="mt-4 max-w-[480px]"
      >
        <fieldset
          disabled={isPending}
          className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
        >
          <TextField
            id="workspace-rename"
            required
            label="Nome"
            autoComplete="off"
            maxLength={WORKSPACE_NAME_MAX_LENGTH}
            hint={`O endereço /w/${slug} não muda.`}
            error={errors.name?.message ?? errors.root?.message}
            {...register("name")}
          />
          <div>
            <Button
              type="submit"
              disabled={!isDirty || isPending}
              className="h-10 px-4 enabled:hover:bg-brand-strong data-pending:cursor-wait data-pending:opacity-100"
              data-pending={isPending || undefined}
            >
              {isPending && (
                <Loader2
                  aria-hidden
                  className="animate-spin motion-reduce:animate-none"
                />
              )}
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
