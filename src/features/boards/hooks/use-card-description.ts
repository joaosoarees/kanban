"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { useWatch } from "react-hook-form";
import * as z from "zod";
import { cardDescriptionSchema } from "@/features/boards/lib/card-schemas";
import { updateCardDescriptionAction } from "@/features/boards/server/card-actions";
import { useActionForm } from "@/hooks/use-action-form";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import type { ActionError } from "@/lib/action-result";

const LOAD_FAILED = "Não foi possível abrir o card. Tente de novo.";
const SAVE_FAILED = "Não foi possível salvar. Tente de novo.";
const NO_CARD: ActionError = { status: "error", message: SAVE_FAILED };

const descriptionResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.object({ description: z.string().nullable() }),
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
    gone: z.boolean().optional(),
  }),
]);

type UseCardDescriptionOptions = {
  workspaceId: string;
  boardId: string;
  cardId: string | null;
  onLoadFailed: (message: string, isGone: boolean) => void;
};

export function useCardDescription({
  workspaceId,
  boardId,
  cardId,
  onLoadFailed,
}: UseCardDescriptionOptions) {
  const [saved, setSaved] = useState<string | null>();
  const [isEditing, setIsEditing] = useState(false);
  const [loadedCardId, setLoadedCardId] = useState(cardId);
  if (loadedCardId !== cardId) {
    setLoadedCardId(cardId);
    setSaved(undefined);
    setIsEditing(false);
  }
  const {
    form: {
      register,
      control,
      reset,
      clearErrors,
      formState: { errors },
    },
    submit,
    isPending: isSaving,
  } = useActionForm({
    schema: cardDescriptionSchema,
    defaultValues: { description: "" },
    action: async (values) =>
      cardId === null
        ? NO_CARD
        : updateCardDescriptionAction(workspaceId, boardId, cardId, values),
    failure: SAVE_FAILED,
    onSuccess: (_, values) => {
      setSaved(values.description);
      setIsEditing(false);
    },
    onError: (failure) => {
      if (failure.gone === true) {
        setIsEditing(false);
      }
    },
  });
  const value = useWatch({ control, name: "description" }) ?? "";
  const draft = isEditing ? value : null;
  const error = errors.description?.message ?? errors.root?.message;
  const isLoading = saved === undefined;
  const isDirty = isEditing && value !== (saved ?? "");

  const reportLoadFailure = useEffectEvent(onLoadFailed);

  useEffect(() => {
    let isCurrent = true;
    const load = async (id: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${id}/description`,
          { cache: "no-store", redirect: "error" },
        );
        const result = descriptionResponseSchema.parse(await response.json());
        if (!isCurrent) {
          return;
        }
        if (result.status === "success") {
          setSaved(result.data.description);
        } else {
          reportLoadFailure(result.message, result.gone === true);
        }
      } catch (caught) {
        console.error(caught);
        if (isCurrent) {
          reportLoadFailure(LOAD_FAILED, false);
        }
      }
    };
    if (isLoading && cardId !== null) {
      void load(cardId);
    }
    return () => {
      isCurrent = false;
    };
  }, [isLoading, workspaceId, boardId, cardId]);

  useUnsavedChangesWarning(isDirty);

  return {
    saved,
    draft,
    error,
    isLoading,
    isEditing,
    isDirty,
    isSaving,
    field: register("description", {
      onChange: () => {
        clearErrors("root");
      },
    }),
    startEditing: () => {
      reset({ description: saved ?? "" });
      setIsEditing(true);
    },
    cancel: () => {
      clearErrors();
      setIsEditing(false);
    },
    save: () => {
      submit();
    },
  };
}

export type CardDescriptionState = ReturnType<typeof useCardDescription>;
