"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import {
  cardActivitySchema,
  mergeActivities,
  refreshActivities,
  type ActivityPage,
} from "@/features/boards/lib/card-activity";

const REFRESH_DELAY_MS = 800;

const EMPTY_PAGE: ActivityPage = { activities: [], nextCursor: null };

const activitySchema = cardActivitySchema.and(
  z.object({ id: z.string(), createdAt: z.string(), byViewer: z.boolean() }),
);

const pageResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.object({
      activities: z.array(activitySchema),
      nextCursor: z.string().nullable(),
    }),
  }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

type ListStatus = "idle" | "loading" | "failed" | "ready";
type OlderStatus = "idle" | "loading" | "failed";

async function fetchActivityPage(
  url: string,
  before: string | null,
): Promise<ActivityPage | null> {
  const query = before === null ? "" : `?before=${before}`;
  try {
    const response = await fetch(`${url}${query}`, {
      cache: "no-store",
      redirect: "error",
    });
    const result = pageResponseSchema.parse(await response.json());
    return result.status === "success" ? result.data : null;
  } catch (caught) {
    console.error(caught);
    return null;
  }
}

type UseCardActivityOptions = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  isOpen: boolean;
  version: string;
};

export function useCardActivity({
  workspaceId,
  boardId,
  cardId,
  isOpen,
  version,
}: UseCardActivityOptions) {
  const url = `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/activity`;
  const [status, setStatus] = useState<ListStatus>("idle");
  const [list, setList] = useState(EMPTY_PAGE);
  const [older, setOlder] = useState<OlderStatus>("idle");
  const [seenVersion, setSeenVersion] = useState(version);
  const [changes, setChanges] = useState(0);
  const [loadedChanges, setLoadedChanges] = useState(0);

  if (version !== seenVersion) {
    setSeenVersion(version);
    setChanges((count) => count + 1);
  }

  if (isOpen && status === "idle") {
    setStatus("loading");
  }

  const isLoading = status === "loading";
  const isStale = status === "ready" && loadedChanges !== changes;

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      const page = await fetchActivityPage(url, null);
      if (ignore) {
        return;
      }
      if (page === null) {
        setStatus("failed");
        return;
      }
      setList(page);
      setLoadedChanges(changes);
      setStatus("ready");
    };
    if (isLoading) {
      void load();
    }
    return () => {
      ignore = true;
    };
  }, [url, isLoading, changes]);

  useEffect(() => {
    let ignore = false;
    const refresh = async () => {
      const page = await fetchActivityPage(url, null);
      if (ignore) {
        return;
      }
      if (page === null) {
        return;
      }
      setList((current) => refreshActivities(current, page));
      setLoadedChanges(changes);
    };
    const timer =
      isOpen && isStale
        ? setTimeout(() => void refresh(), REFRESH_DELAY_MS)
        : undefined;
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [url, isOpen, isStale, changes]);

  return {
    status,
    activities: list.activities,
    hasOlder: list.nextCursor !== null,
    older,
    retry: () => {
      setStatus("loading");
    },
    loadOlder: async () => {
      if (list.nextCursor === null || older === "loading") {
        return;
      }
      setOlder("loading");
      const page = await fetchActivityPage(url, list.nextCursor);
      if (page === null) {
        setOlder("failed");
        return;
      }
      setList((current) => ({
        activities: mergeActivities(current.activities, page.activities),
        nextCursor: page.nextCursor,
      }));
      setOlder("idle");
    },
  };
}

export type CardActivityState = ReturnType<typeof useCardActivity>;
