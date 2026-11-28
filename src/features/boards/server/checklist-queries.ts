import "server-only";
import { db } from "@/server/db";

export type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export async function getCardChecklist(
  workspaceId: string,
  ref: { boardId: string; cardId: string },
): Promise<ChecklistItem[] | null> {
  const card = await db.card.findUnique({
    where: {
      id: ref.cardId,
      column: { boardId: ref.boardId, board: { workspaceId } },
    },
    select: {
      checklistItems: {
        orderBy: { position: "asc" },
        select: { id: true, text: true, completedAt: true },
      },
    },
  });
  if (!card) {
    return null;
  }

  return card.checklistItems.map((item) => ({
    id: item.id,
    text: item.text,
    completed: item.completedAt !== null,
  }));
}
