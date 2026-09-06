/**
 * authStore.ts
 * ============
 * Zustand store for authentication state.
 * Extracted from src/lib/store.ts (AuthState slice).
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Profile } from "@/types";

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
      name: "auth-store",
      partialize: (state) => ({ user: state.user, profile: state.profile }),
    }
  )
);
