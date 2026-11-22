"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import * as z from "zod";
import { updateCardDescriptionAction } from "@/app/(app)/w/[slug]/b/card-actions";
import { cardDescriptionSchema } from "@/lib/card-schemas";

const LOAD_FAILED = "Não foi possível abrir o card. Tente de novo.";
const SAVE_FAILED = "Não foi possível salvar. Tente de novo.";

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
  cardId: string;
  onDirtyChange: (isDirty: boolean) => void;
  onLoadFailed: (message: string) => void;
};

export function useCardDescription({
  workspaceId,
  boardId,
  cardId,
  onDirtyChange,
  onLoadFailed,
}: UseCardDescriptionOptions) {
  const [saved, setSaved] = useState<string | null>();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [isSaving, startSaving] = useTransition();
  const isLoading = saved === undefined;
  const isEditing = draft !== null;
  const isDirty = isEditing && draft !== (saved ?? "");

  const reportLoadFailure = useEffectEvent(onLoadFailed);
  const reportDirty = useEffectEvent(onDirtyChange);

  useEffect(() => {
    let isCurrent = true;
    const load = async () => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/description`,
          { cache: "no-store", redirect: "error" },
        );
        const result = descriptionResponseSchema.parse(await response.json());
        if (!isCurrent) {
          return;
        }
        if (result.status === "success") {
          setSaved(result.data.description);
        } else {
          reportLoadFailure(result.message);
        }
      } catch (caught) {
        console.error(caught);
        if (isCurrent) {
          reportLoadFailure(LOAD_FAILED);
        }
      }
    };
    if (isLoading) {
      void load();
    }
    return () => {
      isCurrent = false;
    };
  }, [isLoading, workspaceId, boardId, cardId]);

  useEffect(() => {
    reportDirty(isDirty);
  }, [isDirty]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [isDirty]);

  const cancel = () => {
    setDraft(null);
    setError(undefined);
  };

  const save = () => {
    const parsed = cardDescriptionSchema.safeParse({ description: draft });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    startSaving(async () => {
      try {
        const result = await updateCardDescriptionAction(
          workspaceId,
          boardId,
          cardId,
          parsed.data,
        );
        if (result.status === "success") {
          startSaving(() => {
            setSaved(parsed.data.description);
            cancel();
          });
          return;
        }
        if (result.gone === true) {
          startSaving(() => {
            setDraft(null);
          });
          return;
        }
        setError(result.fieldErrors?.description?.at(0) ?? result.message);
      } catch (caught) {
        unstable_rethrow(caught);
        console.error(caught);
        setError(SAVE_FAILED);
      }
    });
  };

  return {
    saved,
    draft,
    error,
    isLoading,
    isEditing,
    isDirty,
    isSaving,
    startEditing: () => {
      setDraft(saved ?? "");
    },
    change: (value: string) => {
      setDraft(value);
      setError(undefined);
    },
    cancel,
    save,
  };
}

export type CardDescriptionState = ReturnType<typeof useCardDescription>;
