/**
 * travelStore.ts
 * ==============
 * Zustand store for travel requests state.
 * Extracted from src/lib/store.ts (TravelRequestsState slice).
 */

import { create } from "zustand";
import type { TravelRequest } from "@/types";

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

export const useTravelRequestsStore = create<TravelRequestsState>((set) => ({
  requests: [],
  currentRequest: null,
  isLoading: false,
  setRequests: (requests) => set({ requests }),
  setCurrentRequest: (currentRequest) => set({ currentRequest }),
  addRequest: (request) =>
    set((state) => ({ requests: [request, ...state.requests] })),
  updateRequest: (id, updates) =>
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
      currentRequest:
        state.currentRequest?.id === id
          ? { ...state.currentRequest, ...updates }
          : state.currentRequest,
    })),
  removeRequest: (id) =>
    set((state) => ({
      requests: state.requests.filter((req) => req.id !== id),
      currentRequest:
        state.currentRequest?.id === id ? null : state.currentRequest,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));
