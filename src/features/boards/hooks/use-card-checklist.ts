"use client";

import { useEffect, useRef, useState } from "react";
import * as z from "zod";
import {
  moveToIndex,
  placeAfter,
  previousIdOf,
  type ChecklistEntry,
} from "@/features/boards/lib/checklist-list";
import {
  finishWrite,
  IDLE_SYNC,
  receiveList,
  startWrite,
} from "@/features/boards/lib/checklist-sync";
import {
  deleteChecklistItemAction,
  moveChecklistItemAction,
} from "@/features/boards/server/checklist-actions";
import { setChecklistItemCompletionAction } from "@/features/boards/server/checklist-completion-actions";
import type { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/run-action";

const SAVE_FAILED = "Não foi possível salvar. Tente de novo.";
const RELOAD_FAILED =
  "Não foi possível atualizar o checklist. Feche e abra o card de novo.";

const itemSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});

const responseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.array(itemSchema) }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

type ListStatus = "loading" | "reloading" | "failed" | "ready";

export type ChecklistNotice = { tone: "error" | "info"; message: string };

async function fetchChecklist(
  url: string,
): Promise<ChecklistEntry[] | "gone" | "failed"> {
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "error" });
    if (response.status === 404) {
      return "gone";
    }
    const result = responseSchema.parse(await response.json());
    if (result.status === "error") {
      return "failed";
    }
    return result.data.map(({ id, text, completed }) => ({
      id,
      text,
      completed,
    }));
  } catch (caught) {
    console.error(caught);
    return "failed";
  }
}

type CardChecklistOptions = {
  workspaceId: string;
  boardId: string;
  cardId: string | null;
  onCardGone: () => void;
};

export function useCardChecklist({
  workspaceId,
  boardId,
  cardId,
  onCardGone,
}: CardChecklistOptions) {
  const url =
    cardId === null
      ? null
      : `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/checklist`;
  const [status, setStatus] = useState<ListStatus>("loading");
  const [items, setItems] = useState<ChecklistEntry[]>([]);
  const [notice, setNotice] = useState<ChecklistNotice | null>(null);
  const [loadedUrl, setLoadedUrl] = useState(url);
  const currentUrl = useRef(url);
  const cardGone = useRef(onCardGone);
  const sync = useRef(IDLE_SYNC);
  const loaded = useRef(false);

  if (loadedUrl !== url) {
    setLoadedUrl(url);
    setStatus("loading");
    setItems([]);
    setNotice(null);
  }

  useEffect(() => {
    if (currentUrl.current !== url) {
      sync.current = IDLE_SYNC;
      loaded.current = false;
    }
    currentUrl.current = url;
    cardGone.current = onCardGone;
  });

  const isFetching = status === "loading" || status === "reloading";

  useEffect(() => {
    let ignore = false;
    const load = async (listUrl: string) => {
      const result = await fetchChecklist(listUrl);
      if (ignore) {
        return;
      }
      if (result === "gone") {
        cardGone.current();
        return;
      }
      if (result === "failed") {
        if (loaded.current) {
          setNotice({ tone: "error", message: RELOAD_FAILED });
          setStatus("ready");
        } else {
          setStatus("failed");
        }
        return;
      }
      const received = receiveList(sync.current);
      sync.current = received.sync;
      if (received.apply) {
        setItems(result);
      }
      loaded.current = true;
      setStatus("ready");
    };
    if (isFetching && url !== null) {
      void load(url);
    }
    return () => {
      ignore = true;
    };
  }, [url, isFetching]);

  const isCurrent = (requestUrl: string | null) =>
    requestUrl !== null && currentUrl.current === requestUrl;

  const settle = async (
    write: () => Promise<ActionResult>,
    revert: () => void,
  ) => {
    const requestUrl = url;
    sync.current = startWrite(sync.current);
    const result = await runAction(write, SAVE_FAILED);
    if (!isCurrent(requestUrl)) {
      return;
    }
    const saved = result.status === "success";
    if (result.status === "error" && result.gone === true) {
      setNotice({ tone: "info", message: result.message });
    } else if (!saved) {
      revert();
      setNotice({ tone: "error", message: SAVE_FAILED });
    }
    const finished = finishWrite(sync.current, saved);
    sync.current = finished.sync;
    if (finished.reload) {
      setStatus("reloading");
    }
  };

  const ref = { workspaceId, boardId, cardId };

  return {
    status,
    items,
    notice,
    retry: () => {
      setStatus("loading");
    },
    added: (item: ChecklistEntry) => {
      setNotice(null);
      setItems((current) => [...current, item]);
    },
    renamed: (itemId: string, text: string) => {
      setNotice(null);
      setItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, text } : item)),
      );
    },
    reload: (message: string) => {
      setNotice({ tone: "info", message });
      setStatus("reloading");
    },
    toggle: (itemId: string, completed: boolean) => {
      setNotice(null);
      const setCompleted = (value: boolean) => {
        setItems((current) =>
          current.map((item) =>
            item.id === itemId ? { ...item, completed: value } : item,
          ),
        );
      };
      setCompleted(completed);
      void settle(
        async () =>
          setChecklistItemCompletionAction(
            ref.workspaceId,
            ref.boardId,
            ref.cardId,
            itemId,
            { completed },
          ),
        () => {
          setCompleted(!completed);
        },
      );
    },
    move: (itemId: string, index: number) => {
      const oldPreviousId = previousIdOf(items, itemId);
      const moved = moveToIndex(items, itemId, index);
      if (
        moved === null ||
        oldPreviousId === undefined ||
        moved.previousId === oldPreviousId
      ) {
        return;
      }
      setNotice(null);
      setItems(moved.items);
      void settle(
        async () =>
          moveChecklistItemAction(ref.workspaceId, ref.boardId, ref.cardId, {
            itemId,
            previousItemId: moved.previousId,
          }),
        () => {
          setItems((current) => {
            const item = current.find(({ id }) => id === itemId);
            return item === undefined
              ? current
              : placeAfter(current, item, oldPreviousId);
          });
        },
      );
    },
    remove: (itemId: string) => {
      const item = items.find(({ id }) => id === itemId);
      const oldPreviousId = previousIdOf(items, itemId);
      if (item === undefined || oldPreviousId === undefined) {
        return;
      }
      setNotice(null);
      setItems((current) => current.filter(({ id }) => id !== itemId));
      void settle(
        async () =>
          deleteChecklistItemAction(
            ref.workspaceId,
            ref.boardId,
            ref.cardId,
            itemId,
          ),
        () => {
          setItems((current) => placeAfter(current, item, oldPreviousId));
        },
      );
    },
  };
}

export type CardChecklistState = ReturnType<typeof useCardChecklist>;
