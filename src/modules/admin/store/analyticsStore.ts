/**
 * analyticsStore.ts
 * =================
 * Zustand store for admin analytics state.
 * Extracted from src/lib/store.ts (AnalyticsState slice).
 */

import { create } from "zustand";
import type { AnalyticsData } from "@/types";

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
