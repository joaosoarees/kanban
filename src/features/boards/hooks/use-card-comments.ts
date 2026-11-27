"use client";

import { useEffect, useRef, useState } from "react";
import * as z from "zod";
import { newestFirst, withPage } from "@/features/boards/lib/comment-list";
import type {
  CardComment,
  CommentPage,
} from "@/features/boards/server/comment-queries";

const commentSchema = z.object({
  id: z.string(),
  body: z.string(),
  createdAt: z.string(),
  editedAt: z.string().nullable(),
  author: z.object({ id: z.string(), name: z.string() }).nullable(),
  canEdit: z.boolean(),
  canDelete: z.boolean(),
});

const pageResponseSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.object({
      comments: z.array(commentSchema),
      nextCursor: z.string().nullable(),
    }),
  }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

type ListStatus = "loading" | "failed" | "ready";
type OlderStatus = "idle" | "loading" | "failed";

async function fetchCommentPage(
  url: string,
  before: string | null,
): Promise<CommentPage | null> {
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

export function useCardComments(
  workspaceId: string,
  boardId: string,
  cardId: string | null,
) {
  const url =
    cardId === null
      ? null
      : `/api/workspaces/${workspaceId}/boards/${boardId}/cards/${cardId}/comments`;
  const [status, setStatus] = useState<ListStatus>("loading");
  const [comments, setComments] = useState<CardComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [older, setOlder] = useState<OlderStatus>("idle");
  const [loadedUrl, setLoadedUrl] = useState(url);
  const removedIds = useRef(new Set<string>());
  const currentUrl = useRef(url);

  if (loadedUrl !== url) {
    setLoadedUrl(url);
    setStatus("loading");
    setComments([]);
    setNextCursor(null);
    setOlder("idle");
  }

  const isLoading = status === "loading";

  useEffect(() => {
    currentUrl.current = url;
  }, [url]);

  useEffect(() => {
    let ignore = false;
    const load = async (pageUrl: string) => {
      const page = await fetchCommentPage(pageUrl, null);
      if (ignore) {
        return;
      }
      if (page === null) {
        setStatus("failed");
        return;
      }
      const removed = new Set(removedIds.current);
      setComments((current) => withPage(current, page.comments, removed));
      setNextCursor(page.nextCursor);
      setStatus("ready");
    };
    if (isLoading && url !== null) {
      void load(url);
    }
    return () => {
      ignore = true;
    };
  }, [url, isLoading]);

  return {
    status,
    comments,
    hasOlder: nextCursor !== null,
    older,
    retry: () => {
      setStatus("loading");
    },
    loadOlder: async () => {
      if (url === null || nextCursor === null || older === "loading") {
        return;
      }
      setOlder("loading");
      const page = await fetchCommentPage(url, nextCursor);
      if (currentUrl.current !== url) {
        return;
      }
      if (page === null) {
        setOlder("failed");
        return;
      }
      const removed = new Set(removedIds.current);
      setComments((current) => withPage(current, page.comments, removed));
      setNextCursor(page.nextCursor);
      setOlder("idle");
    },
    put: (comment: CardComment) => {
      setComments((current) => newestFirst([...current, comment]));
    },
    remove: (commentId: string) => {
      removedIds.current.add(commentId);
      setComments((current) =>
        current.filter((comment) => comment.id !== commentId),
      );
    },
  };
}

export type CardCommentsState = ReturnType<typeof useCardComments>;
