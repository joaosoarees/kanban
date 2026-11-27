"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useWatch } from "react-hook-form";
import type { CardChecklistState } from "@/features/boards/hooks/use-card-checklist";
import { checklistItemSchema } from "@/features/boards/lib/checklist-schemas";
import type { ChecklistEntry } from "@/features/boards/lib/checklist-list";
import {
  createChecklistItemAction,
  updateChecklistItemAction,
} from "@/features/boards/server/checklist-actions";
import { useActionForm } from "@/hooks/use-action-form";
import { useUnsavedChangesWarning } from "@/hooks/use-unsaved-changes-warning";
import type { ActionError } from "@/lib/action-result";
import { hasVisibleText } from "@/lib/text";

const CREATE_FAILED = "Não foi possível adicionar o item. Tente de novo.";
const EDIT_FAILED = "Não foi possível salvar o item. Tente de novo.";

function noCard(message: string): ActionError {
  return { status: "error", message };
}

type ChecklistFormsOptions = {
  workspaceId: string;
  boardId: string;
  cardId: string | null;
  checklist: CardChecklistState;
};

export function useChecklistForms({
  workspaceId,
  boardId,
  cardId,
  checklist,
}: ChecklistFormsOptions) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nextEdit, setNextEdit] = useState<ChecklistEntry | null>(null);
  const [formsCardId, setFormsCardId] = useState(cardId);
  const refocusAddButton = useRef(false);
  const refocusTextOf = useRef<string | null>(null);

  if (formsCardId !== cardId) {
    setFormsCardId(cardId);
    setIsAdding(false);
    setEditingId(null);
    setNextEdit(null);
  }

  const add = useActionForm({
    schema: checklistItemSchema,
    defaultValues: { text: "" },
    action: async (values) =>
      cardId === null
        ? noCard(CREATE_FAILED)
        : createChecklistItemAction(workspaceId, boardId, cardId, values),
    failure: CREATE_FAILED,
    onSuccess: ({ id }, values) => {
      checklist.added({ id, text: values.text, completed: false });
      add.form.reset({ text: "" });
      add.form.setFocus("text");
    },
    onError: (error) => {
      if (error.gone === true) {
        checklist.reload(error.message);
      }
    },
  });

  const edit = useActionForm({
    schema: checklistItemSchema,
    defaultValues: { text: "" },
    action: async (values) =>
      cardId === null || editingId === null
        ? noCard(EDIT_FAILED)
        : updateChecklistItemAction(
            workspaceId,
            boardId,
            cardId,
            editingId,
            values,
          ),
    failure: EDIT_FAILED,
    onSuccess: (_data, values) => {
      if (editingId !== null) {
        checklist.renamed(editingId, values.text);
        refocusTextOf.current = editingId;
      }
      setEditingId(null);
    },
    onError: (error) => {
      if (error.gone === true) {
        setEditingId(null);
        checklist.reload(error.message);
      }
    },
  });

  const { form: addForm } = add;
  const { form: editForm } = edit;
  const formsResetFor = useRef(cardId);

  useLayoutEffect(() => {
    if (formsResetFor.current !== cardId) {
      formsResetFor.current = cardId;
      refocusTextOf.current = null;
      refocusAddButton.current = false;
      addForm.reset({ text: "" });
      editForm.reset({ text: "" });
    }
  }, [cardId, addForm, editForm]);

  const addText = useWatch({ control: add.form.control, name: "text" });
  const { isDirty: isEditChanged } = edit.form.formState;
  const hasDraft =
    isAdding && checklist.status !== "failed" && hasVisibleText(addText);
  const hasEdit = editingId !== null && isEditChanged;
  const isDirty = hasDraft || hasEdit;
  const isBusy = add.isPending || edit.isPending;

  useUnsavedChangesWarning(isDirty);

  const openEdit = (item: ChecklistEntry) => {
    refocusTextOf.current = null;
    edit.form.reset({ text: item.text });
    setNextEdit(null);
    setEditingId(item.id);
  };

  const closeAdd = () => {
    add.form.reset({ text: "" });
    refocusAddButton.current = true;
    setIsAdding(false);
  };

  return {
    isDirty,
    isBusy,
    focusAfterRemove: (neighborId: string | null) => {
      refocusTextOf.current = neighborId;
      refocusAddButton.current = neighborId === null;
    },
    discard: () => {
      refocusTextOf.current = null;
      add.form.reset({ text: "" });
      setIsAdding(false);
      setEditingId(null);
      setNextEdit(null);
    },
    add: {
      ...add,
      isOpen: isAdding,
      buttonRef: (node: HTMLButtonElement | null) => {
        if (node !== null && refocusAddButton.current) {
          refocusAddButton.current = false;
          node.focus();
        }
      },
      open: () => {
        setIsAdding(true);
      },
      close: closeAdd,
    },
    edit: {
      ...edit,
      itemId: editingId,
      nextItem: nextEdit,
      start: (item: ChecklistEntry) => {
        if (edit.isPending || editingId === item.id) {
          return;
        }
        if (hasEdit) {
          setNextEdit(item);
          return;
        }
        openEdit(item);
      },
      keepEditing: () => {
        setNextEdit(null);
        edit.form.setFocus("text");
      },
      discardForNext: () => {
        const isListed = checklist.items.some(({ id }) => id === nextEdit?.id);
        if (nextEdit !== null && isListed) {
          openEdit(nextEdit);
          return;
        }
        setNextEdit(null);
        setEditingId(null);
      },
      cancel: () => {
        refocusTextOf.current = editingId;
        setEditingId(null);
      },
      textButtonRef: (itemId: string) => (node: HTMLButtonElement | null) => {
        if (node !== null && refocusTextOf.current === itemId) {
          refocusTextOf.current = null;
          node.focus();
        }
      },
    },
  };
}

export type ChecklistFormsState = ReturnType<typeof useChecklistForms>;
