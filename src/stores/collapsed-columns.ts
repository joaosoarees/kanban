import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { preferenceStorage } from "@/stores/preference-storage";

type CollapsedColumnsState = {
  collapsedIds: string[];
  hasLoaded: boolean;
  toggle: (columnId: string) => void;
  forget: (columnId: string) => void;
};

export const useCollapsedColumns = create<CollapsedColumnsState>()(
  persist(
    (set) => ({
      collapsedIds: [],
      hasLoaded: false,
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
    {
      name: "kanbanary-collapsed-columns",
      storage: createJSONStorage(() => preferenceStorage),
      skipHydration: true,
      partialize: ({ collapsedIds }) => ({ collapsedIds }),
      onRehydrateStorage: () => () => {
        if (!useCollapsedColumns.getState().hasLoaded) {
          useCollapsedColumns.setState({ hasLoaded: true });
        }
      },
    },
  ),
);
