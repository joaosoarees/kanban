import { create } from "zustand";
import { persist } from "zustand/middleware";

type CollapsedColumnsState = {
  collapsedIds: string[];
  toggle: (columnId: string) => void;
  forget: (columnId: string) => void;
};

export const useCollapsedColumns = create<CollapsedColumnsState>()(
  persist(
    (set) => ({
      collapsedIds: [],
      toggle: (columnId) => {
        set(({ collapsedIds }) => ({
          collapsedIds: collapsedIds.includes(columnId)
            ? collapsedIds.filter((id) => id !== columnId)
            : [...collapsedIds, columnId],
        }));
      },
      forget: (columnId) => {
        set(({ collapsedIds }) => ({
          collapsedIds: collapsedIds.filter((id) => id !== columnId),
        }));
      },
    }),
    { name: "kanbanary-collapsed-columns", skipHydration: true },
  ),
);
