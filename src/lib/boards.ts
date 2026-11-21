import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import * as z from "zod";
import { db } from "@/lib/db";

export const COLUMN_ORDER = [{ position: "asc" }, { id: "asc" }] as const;

export async function getBoards(workspaceId: string) {
  return db.board.findMany({
    where: { workspaceId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, name: true, createdAt: true },
  });
}

export const requireBoard = cache(
  async (workspaceId: string, boardId: string) => {
    const id = z.uuid().safeParse(boardId);
    if (!id.success) {
      notFound();
    }

    const board = await db.board.findFirst({
      where: { id: id.data, workspaceId },
      select: {
        id: true,
        name: true,
        columns: {
          orderBy: [...COLUMN_ORDER],
          select: { id: true, name: true, position: true },
        },
      },
    });
    if (!board) {
      notFound();
    }

    return board;
  },
);
