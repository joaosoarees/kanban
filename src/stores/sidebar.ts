import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { preferenceStorage } from "@/stores/preference-storage";

type SidebarState = {
  collapsed: boolean;
  hasToggled: boolean;
  toggle: () => void;
};

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      hasToggled: false,
      toggle: () => {
        set(({ collapsed }) => ({ collapsed: !collapsed, hasToggled: true }));
      },
    }),
    {
      name: "kanbanary-sidebar",
      storage: createJSONStorage(() => preferenceStorage),
      skipHydration: true,
      partialize: ({ collapsed }) => ({ collapsed }),
    },
  ),
);
