// =============================================================================
// Zustand Store - Global State Management
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile, TravelRequest, AnalyticsData } from '@/types';

// Auth Store
interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, profile: null }),
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
);

// Travel Requests Store
interface TravelRequestsState {
  requests: TravelRequest[];
  currentRequest: TravelRequest | null;
  isLoading: boolean;
  setRequests: (requests: TravelRequest[]) => void;
  setCurrentRequest: (request: TravelRequest | null) => void;
  addRequest: (request: TravelRequest) => void;
  updateRequest: (id: string, updates: Partial<TravelRequest>) => void;
  removeRequest: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTravelRequestsStore = create<TravelRequestsState>((set, get) => ({
  requests: [],
  currentRequest: null,
  isLoading: false,
  setRequests: (requests) => set({ requests }),
  setCurrentRequest: (currentRequest) => set({ currentRequest }),
  addRequest: (request) => set((state) => ({ 
    requests: [request, ...state.requests] 
  })),
  updateRequest: (id, updates) => set((state) => ({
    requests: state.requests.map((req) => 
      req.id === id ? { ...req, ...updates } : req
    ),
    currentRequest: state.currentRequest?.id === id 
      ? { ...state.currentRequest, ...updates }
      : state.currentRequest
  })),
  removeRequest: (id) => set((state) => ({
    requests: state.requests.filter((req) => req.id !== id),
    currentRequest: state.currentRequest?.id === id ? null : state.currentRequest
  })),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Admin Analytics Store
interface AnalyticsState {
  data: AnalyticsData | null;
  isLoading: boolean;
  lastUpdated: string | null;
  setData: (data: AnalyticsData) => void;
  setLoading: (loading: boolean) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  data: null,
  isLoading: false,
  lastUpdated: null,
  setData: (data) => set({ data, lastUpdated: new Date().toISOString() }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Notifications Store
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }]
    }));
    
    // Auto remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      }));
    }, duration);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearAll: () => set({ notifications: [] }),
}));

// UI State Store
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'system',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-store',
    }
  )
);