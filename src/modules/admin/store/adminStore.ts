/**
 * admin-store.ts
 * Global UI state for the admin dashboard — sidebar + notification count.
 * Persists sidebarOpen in localStorage via zustand persist middleware.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminStore {
  sidebarOpen: boolean;
  unreadNotifications: number;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setUnreadNotifications: (count: number) => void;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      sidebarOpen:         true,
      unreadNotifications: 0,
      setSidebarOpen:      (open) => set({ sidebarOpen: open }),
      toggleSidebar:       () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
    }),
    {
      name:        "admin-ui-store",
      partialize:  (s) => ({ sidebarOpen: s.sidebarOpen }), // only persist sidebar state
    }
  )
);
