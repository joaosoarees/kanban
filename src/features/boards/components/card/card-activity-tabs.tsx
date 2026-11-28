"use client";

import { Tabs } from "@base-ui/react/tabs";
import { useState, type ReactNode } from "react";
import { CardHistory } from "@/features/boards/components/card/card-history";
import { useCardActivity } from "@/features/boards/hooks/use-card-activity";

type ActivityTab = "comments" | "history";

const TAB_CLASSES =
  "-mb-px inline-flex h-10 items-center gap-1.5 rounded-t-sm border-b-2 border-transparent px-0.5 text-sm font-medium text-muted-foreground outline-hidden hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-active:border-brand-fg data-active:text-foreground";

const PANEL_CLASSES =
  "rounded-sm outline-hidden focus-visible:ring-3 focus-visible:ring-ring/50";

const numberFormat = new Intl.NumberFormat("pt-BR");

type CardActivityTabsProps = {
  workspaceId: string;
  boardId: string;
  cardId: string;
  commentCount: number;
  version: string;
  isSaving: boolean;
  comments: ReactNode;
};

export function CardActivityTabs({
  workspaceId,
  boardId,
  cardId,
  commentCount,
  version,
  isSaving,
  comments,
}: CardActivityTabsProps) {
  const [tab, setTab] = useState<ActivityTab>("comments");
  const history = useCardActivity({
    workspaceId,
    boardId,
    cardId,
    isOpen: tab === "history",
    version,
    isSaving,
  });

  return (
    <Tabs.Root
      value={tab}
      onValueChange={(value) => {
        setTab(value === "history" ? "history" : "comments");
      }}
      className="flex shrink-0 flex-col gap-3"
    >
      <Tabs.List aria-label="Atividade do card" className="flex gap-6 border-b">
        <Tabs.Tab value="comments" className={TAB_CLASSES}>
          Comentários
          {commentCount > 0 && (
            <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
              {numberFormat.format(commentCount)}
            </span>
          )}
        </Tabs.Tab>
        <Tabs.Tab value="history" className={TAB_CLASSES}>
          Histórico
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="comments" keepMounted className={PANEL_CLASSES}>
        {comments}
      </Tabs.Panel>
      <Tabs.Panel value="history" className={PANEL_CLASSES}>
        <CardHistory history={history} />
      </Tabs.Panel>
    </Tabs.Root>
  );
}
