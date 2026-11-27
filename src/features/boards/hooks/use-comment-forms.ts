"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import type { ActionError } from "@/lib/action-result";
import { hasVisibleText } from "@/lib/text";

const CREATE_FAILED = "Não foi possível comentar. Tente de novo.";
const EDIT_FAILED = "Não foi possível salvar.";

function noCard(message: string): ActionError {
  return { status: "error", message };
}

type CommentFormsOptions = {
  workspaceId: string;
  boardId: string;
  cardId: string | null;
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
  const [formsCardId, setFormsCardId] = useState(cardId);
  if (formsCardId !== cardId) {
    setFormsCardId(cardId);
    setEditingId(null);
    setNextEdit(null);
  }

  const composer = useActionForm({
    schema: commentSchema,
    defaultValues: { body: "" },
    action: async (values) =>
      cardId === null
        ? noCard(CREATE_FAILED)
        : createCommentAction(workspaceId, boardId, cardId, values),
    failure: CREATE_FAILED,
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
      cardId === null || editingId === null
        ? noCard(EDIT_FAILED)
        : editCommentAction(workspaceId, boardId, cardId, editingId, values),
    failure: EDIT_FAILED,
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

  const { form: composerForm } = composer;
  const { form: editForm } = edit;

  const formsResetFor = useRef(cardId);

  useLayoutEffect(() => {
    if (formsResetFor.current !== cardId) {
      formsResetFor.current = cardId;
      composerForm.reset({ body: "" });
      editForm.reset({ body: "" });
    }
  }, [cardId, composerForm, editForm]);

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
    discard: () => {
      composer.form.reset({ body: "" });
      setEditingId(null);
      setNextEdit(null);
    },
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
