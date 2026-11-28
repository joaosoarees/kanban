"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  checklistResponseSchema,
  moveToIndex,
  placeAfter,
  previousIdOf,
  type ChecklistEntry,
} from "@/features/boards/lib/checklist-list";
import {
  finishWrite,
  IDLE_SYNC,
  markChanged,
  receiveList,
  startWrite,
  type ChecklistSync,
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
    const result = checklistResponseSchema.parse(await response.json());
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

function syncOf(syncs: Map<string, ChecklistSync>, url: string) {
  return syncs.get(url) ?? IDLE_SYNC;
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
  const [request, setRequest] = useState(0);
  const currentUrl = useRef(url);
  const cardGone = useEffectEvent(onCardGone);
  const syncs = useRef(new Map<string, ChecklistSync>());
  const loaded = useRef(false);

  if (loadedUrl !== url) {
    setLoadedUrl(url);
    setStatus("loading");
    setItems([]);
    setNotice(null);
  }

  useEffect(() => {
    if (currentUrl.current !== url) {
      loaded.current = false;
    }
    currentUrl.current = url;
  }, [url]);

  useEffect(() => {
    let ignore = false;
    const load = async (listUrl: string) => {
      const changesWhenSent = syncOf(syncs.current, listUrl).changes;
      const result = await fetchChecklist(listUrl);
      if (ignore) {
        return;
      }
      if (result === "gone") {
        cardGone();
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
      const received = receiveList(
        syncOf(syncs.current, listUrl),
        changesWhenSent,
      );
      syncs.current.set(listUrl, received.sync);
      if (received.reload) {
        setRequest(request + 1);
        return;
      }
      if (received.apply) {
        setItems(result);
        loaded.current = true;
      }
      if (loaded.current) {
        setStatus("ready");
      }
    };
    if (url !== null) {
      void load(url);
    }
    return () => {
      ignore = true;
    };
  }, [url, request]);

  const markListChanged = () => {
    if (url !== null) {
      syncs.current.set(url, markChanged(syncOf(syncs.current, url)));
    }
  };

  const requestList = () => {
    setStatus((current) => (current === "ready" ? "reloading" : current));
    setRequest((count) => count + 1);
  };

  const settle = async (
    write: () => Promise<ActionResult>,
    revert: () => void,
  ) => {
    const requestUrl = url;
    if (requestUrl === null) {
      return;
    }
    syncs.current.set(
      requestUrl,
      startWrite(syncOf(syncs.current, requestUrl)),
    );
    const result = await runAction(write, SAVE_FAILED);
    const saved = result.status === "success";
    const finished = finishWrite(syncOf(syncs.current, requestUrl), saved);
    syncs.current.set(requestUrl, finished.sync);
    if (currentUrl.current !== requestUrl) {
      return;
    }
    if (result.status === "error" && result.gone === true) {
      setNotice({ tone: "info", message: result.message });
    } else if (result.status === "error") {
      revert();
      setNotice({ tone: "error", message: result.message });
    }
    if (finished.reload) {
      requestList();
    }
  };

  const ref = { workspaceId, boardId, cardId };

  return {
    status,
    items,
    notice,
    retry: () => {
      setStatus("loading");
      setRequest((count) => count + 1);
    },
    added: (item: ChecklistEntry) => {
      markListChanged();
      setNotice(null);
      setItems((current) =>
        current.some(({ id }) => id === item.id) ? current : [...current, item],
      );
    },
    renamed: (itemId: string, text: string) => {
      markListChanged();
      setNotice(null);
      setItems((current) =>
        current.map((item) => (item.id === itemId ? { ...item, text } : item)),
      );
    },
    reload: (message: string) => {
      setNotice({ tone: "info", message });
      requestList();
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
      setItems(
        (current) => moveToIndex(current, itemId, index)?.items ?? current,
      );
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
