/**
 * lib/store.ts â€” COMPATIBILITY SHIM
 * ===================================
 * All stores have been moved to their feature modules.
 * This file re-exports everything for backward compatibility.
 *
 * Prefer importing directly from the feature module:
 *   import { useAuthStore }           from "@/modules/auth";
 *   import { useAdminStore }          from "@/modules/admin";
 *   import { useAnalyticsStore }      from "@/modules/admin";
 *   import { useTravelRequestsStore } from "@/modules/travel";
 *   import { useNotificationsStore }  from "@/modules/notifications";
 *
 * @deprecated Use feature-module imports above instead.
 */


export { useAdminStore, useAnalyticsStore } from "@/modules/admin";
export { useTravelRequestsStore }    from "@/modules/travel";
export { useNotificationsStore }     from "@/modules/notifications";

// UIStore â€” kept inline here (no dedicated module for UI-only state)
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "system",
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: "ui-store" }
  )
);

