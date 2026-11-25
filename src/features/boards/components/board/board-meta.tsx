"use client";

import { createContext, use, useMemo, type ReactNode } from "react";
import type { LabelColor } from "@/generated/prisma/enums";

export type BoardLabel = {
  id: string;
  name: string;
  color: LabelColor;
};

export type BoardMember = {
  id: string;
  name: string;
  isViewer: boolean;
};

type BoardMeta = {
  labels: BoardLabel[];
  members: BoardMember[];
};

const BoardMetaContext = createContext<BoardMeta>({ labels: [], members: [] });

export function BoardMetaProvider({
  labels,
  members,
  children,
}: BoardMeta & { children: ReactNode }) {
  const meta = useMemo(() => ({ labels, members }), [labels, members]);
  return <BoardMetaContext value={meta}>{children}</BoardMetaContext>;
}

export function useBoardMeta() {
  return use(BoardMetaContext);
}
