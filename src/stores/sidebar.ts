import { create } from "zustand";
import { persist } from "zustand/middleware";

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
      skipHydration: true,
      partialize: ({ collapsed }) => ({ collapsed }),
    },
  ),
);
