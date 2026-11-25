"use client";

import { Check, ChevronLeft } from "lucide-react";
import { useEffect, useId } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import { primaryButton } from "@/components/button-styles";
import { PendingButton } from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BoardLabel } from "@/features/boards/components/board/board-meta";
import { LABEL_COLOR_CLASSES } from "@/features/boards/components/label/label-tag";
import {
  LABEL_GONE_MESSAGE,
  LABEL_NAME_MAX_LENGTH,
  labelSchema,
} from "@/features/boards/lib/label-schemas";
import {
  createLabelAction,
  updateLabelAction,
} from "@/features/boards/server/label-actions";
import type { LabelColor } from "@/generated/prisma/enums";
import { useActionForm } from "@/hooks/use-action-form";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

const SAVE_FAILED = "Não foi possível salvar. Tente de novo.";

const COLOR_OPTIONS: { color: LabelColor; name: string }[] = [
  { color: "GRAY", name: "Cinza" },
  { color: "RED", name: "Vermelho" },
  { color: "ORANGE", name: "Laranja" },
  { color: "YELLOW", name: "Amarelo" },
  { color: "GREEN", name: "Verde" },
  { color: "TEAL", name: "Turquesa" },
  { color: "BLUE", name: "Azul" },
  { color: "PURPLE", name: "Roxo" },
];

export const LABEL_COLORS = COLOR_OPTIONS.map(({ color }) => color);

export type LabelDraft = Omit<BoardLabel, "id"> & { id: string | null };

type LabelEditorProps = {
  workspaceId: string;
  boardId: string;
  draft: LabelDraft;
  onBusyChange: (isBusy: boolean) => void;
  onBack: () => void;
  onCreated: (labelId: string) => void;
  onDelete: (labelId: string) => void;
};

export function LabelEditor({
  workspaceId,
  boardId,
  draft,
  onBusyChange,
  onBack,
  onCreated,
  onDelete,
}: LabelEditorProps) {
  const nameId = useId();
  const hintId = useId();
  const labelId = draft.id;

  const persist = async (input: {
    name: string;
    color: LabelColor;
  }): Promise<ActionResult<string | null>> => {
    if (labelId !== null) {
      const result = await updateLabelAction(
        workspaceId,
        boardId,
        labelId,
        input,
      );
      return result.status === "success"
        ? { status: "success", data: null }
        : result;
    }
    const result = await createLabelAction(workspaceId, boardId, input);
    return result.status === "success"
      ? { status: "success", data: result.data.id }
      : result;
  };

  const {
    form: {
      register,
      control,
      setFocus,
      clearErrors,
      formState: { errors },
    },
    submit,
    isPending: isSaving,
  } = useActionForm({
    schema: labelSchema,
    defaultValues: { name: draft.name, color: draft.color },
    action: persist,
    failure: SAVE_FAILED,
    onSuccess: (createdId) => {
      if (createdId === null) {
        onBack();
      } else {
        onCreated(createdId);
      }
    },
    onError: (failure) => {
      if (failure.gone === true) {
        onBack();
        return;
      }
      if (failure.message === LABEL_GONE_MESSAGE) {
        toast.error(failure.message);
        onBack();
        return;
      }
      setFocus("name");
    },
  });
  const name = useWatch({ control, name: "name" });
  const color = useWatch({ control, name: "color" });
  const error =
    errors.name?.message ?? errors.color?.message ?? errors.root?.message;

  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      setFocus("name");
    }
  }, [setFocus]);

  useEffect(() => {
    onBusyChange(isSaving);
    return () => {
      onBusyChange(false);
    };
  }, [isSaving, onBusyChange]);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar para a lista"
          disabled={isSaving}
          onClick={onBack}
          className="-ml-1 size-11 text-fg-muted sm:size-7"
        >
          <ChevronLeft aria-hidden />
        </Button>
        {labelId === null ? "Nova etiqueta" : "Editar etiqueta"}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={nameId} className="text-[13px] font-medium">
          Nome
        </label>
        <Input
          {...register("name", {
            onChange: () => {
              clearErrors("root");
            },
          })}
          id={nameId}
          maxLength={LABEL_NAME_MAX_LENGTH}
          readOnly={isSaving}
          aria-invalid={error !== undefined}
          aria-describedby={hintId}
          className="h-11 text-base sm:h-9 sm:text-sm"
        />
        <div id={hintId} className="min-h-[18px] text-[13px]/[18px]">
          <p
            role="alert"
            className="flex items-start gap-1.5 text-danger-text empty:hidden"
          >
            {error !== undefined && (
              <>
                <span
                  aria-hidden
                  className="mt-[5px] size-2 shrink-0 rounded-full bg-destructive"
                />
                {error}
              </>
            )}
          </p>
          {error === undefined && (
            <p className="text-fg-muted">
              {name.length} de {LABEL_NAME_MAX_LENGTH}
            </p>
          )}
        </div>
      </div>

      <fieldset className="flex flex-col gap-1" disabled={isSaving}>
        <legend className="mb-1 text-[13px] font-medium">Cor</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {COLOR_OPTIONS.map((option) => (
            <label key={option.color} className="relative cursor-pointer">
              <input
                {...register("color")}
                type="radio"
                value={option.color}
                aria-label={option.name}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border-2 border-transparent peer-checked:border-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 sm:h-8",
                  LABEL_COLOR_CLASSES[option.color],
                )}
              >
                {color === option.color && (
                  <Check aria-hidden className="size-4" strokeWidth={3} />
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-2">
        {labelId !== null && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => {
              onDelete(labelId);
            }}
            className="h-11 px-2 text-danger-text hover:bg-danger-bg hover:text-danger-text sm:h-8"
          >
            Excluir
          </Button>
        )}
        <span className="flex-1" />
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={onBack}
          className="h-11 px-3 sm:h-8"
        >
          Cancelar
        </Button>
        <PendingButton
          type="submit"
          isPending={isSaving}
          pendingLabel="Salvando…"
          className={cn("h-11 px-3 sm:h-8", primaryButton)}
        >
          Salvar
        </PendingButton>
      </div>
    </form>
  );
}
