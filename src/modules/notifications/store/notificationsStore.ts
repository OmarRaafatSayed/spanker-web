/**
 * notificationsStore.ts
 * =====================
 * Zustand store for global UI notifications (toasts).
 * Extracted from src/lib/store.ts (NotificationsState slice).
 */

import { create } from "zustand";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    const duration = notification.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, duration);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}));
