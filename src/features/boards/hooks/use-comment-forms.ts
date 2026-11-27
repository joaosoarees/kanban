"use client";

import { useEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { CardCommentsState } from "@/features/boards/hooks/use-card-comments";
import { commentSchema } from "@/features/boards/lib/comment-schemas";
import type { CardComment } from "@/features/boards/server/comment-queries";
import {
  createCommentAction,
  editCommentAction,
} from "@/features/boards/server/comment-actions";
import { useActionForm } from "@/hooks/use-action-form";
import { hasVisibleText } from "@/lib/text";

type CommentFormsOptions = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  comments: CardCommentsState;
};

export function useCommentForms({
  workspaceId,
  boardId,
  cardId,
  comments,
}: CommentFormsOptions) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nextEdit, setNextEdit] = useState<CardComment | null>(null);
  const composerFieldRef = useRef<HTMLTextAreaElement>(null);

  const composer = useActionForm({
    schema: commentSchema,
    defaultValues: { body: "" },
    action: async (values) =>
      createCommentAction(workspaceId, boardId, cardId, values),
    failure: "Não foi possível comentar. Tente de novo.",
    onSuccess: (comment) => {
      composer.form.reset({ body: "" });
      comments.put(comment);
      requestAnimationFrame(() => composerFieldRef.current?.focus());
    },
  });
  const edit = useActionForm({
    schema: commentSchema,
    defaultValues: { body: "" },
    action: async (values) =>
      editCommentAction(workspaceId, boardId, cardId, editingId ?? "", values),
    failure: "Não foi possível salvar.",
    onSuccess: (comment) => {
      comments.put(comment);
      setEditingId(null);
    },
    onError: (error) => {
      if (error.gone === true && editingId !== null) {
        toast.error(error.message);
        comments.remove(editingId);
        setEditingId(null);
      }
    },
  });

  const composerBody = useWatch({
    control: composer.form.control,
    name: "body",
  });
  const editBody = useWatch({ control: edit.form.control, name: "body" });
  const { isDirty: isEditChanged } = edit.form.formState;
  const hasDraft = hasVisibleText(composerBody);
  const hasEdit = editingId !== null && isEditChanged;
  const unsaved = hasDraft
    ? hasEdit
      ? "both"
      : "comment"
    : hasEdit
      ? "edit"
      : null;
  const isBusy = composer.isPending || edit.isPending;

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (unsaved !== null) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [unsaved]);

  const openEdit = (comment: CardComment) => {
    edit.form.reset({ body: comment.body });
    setNextEdit(null);
    setEditingId(comment.id);
  };

  return {
    unsaved,
    isBusy,
    composer: {
      ...composer,
      body: composerBody,
      hasDraft,
      fieldRef: composerFieldRef,
    },
    edit: {
      ...edit,
      body: editBody,
      commentId: editingId,
      nextComment: nextEdit,
      start: (comment: CardComment) => {
        if (edit.isPending || editingId === comment.id) {
          return;
        }
        if (hasEdit) {
          setNextEdit(comment);
          return;
        }
        openEdit(comment);
      },
      cancel: () => {
        setEditingId(null);
      },
      keepEditing: () => {
        setNextEdit(null);
        edit.form.setFocus("body");
      },
      discardForNext: () => {
        const isListed = comments.comments.some(
          ({ id }) => id === nextEdit?.id,
        );
        if (nextEdit !== null && isListed) {
          openEdit(nextEdit);
          return;
        }
        setNextEdit(null);
        setEditingId(null);
      },
    },
  };
}

export type CommentFormsState = ReturnType<typeof useCommentForms>;
