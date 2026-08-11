"use client";

/**
 * useFlightSearch.ts
 * ==================
 * REFACTORED (Task 2):
 *   - Replaced direct searchFlights() import from @/lib/api
 *   - Now routes through crmAdapter.searchFlights()
 *   - Returns ServiceResult internally, surfaces clean error string to UI
 */

import { useState } from "react";
import { crmAdapter } from "@/lib/services/crm-adapter";
import type { FlightOffer, FlightSearchRequest, TravelClass } from "@/types/flights";

export interface FlightSearchState {
  results:  FlightOffer[];
  loading:  boolean;
  error:    string | null;
  searched: boolean;
}

export interface UseFlightSearchReturn extends FlightSearchState {
  search: (params: FlightSearchRequest) => Promise<void>;
  clear:  () => void;
}

export function useFlightSearch(): UseFlightSearchReturn {
  const [state, setState] = useState<FlightSearchState>({
    results:  [],
    loading:  false,
    error:    null,
    searched: false,
  });

  async function search(params: FlightSearchRequest): Promise<void> {
    setState({ results: [], loading: true, error: null, searched: false });

    const result = await crmAdapter.searchFlights(params);

    if (!result.ok) {
      // Only set error if it's not a graceful degradation message
      // For 503/502/504 errors, we show a friendly message instead of the raw error
      const isNetworkError = result.status === 503 || result.status === 502 || result.status === 504;
      setState({ 
        results: [], 
        loading: false, 
        error: isNetworkError ? null : result.error, 
        searched: true 
      });
      
      // Log network errors for debugging but don't show to user
      if (isNetworkError) {
        console.warn("[useFlightSearch] Service temporarily unavailable - showing friendly message");
      }
      return;
    }

    const { success, flights, error, detail } = result.data;
    if (success) {
      setState({ results: flights ?? [], loading: false, error: null, searched: true });
    } else {
      setState({ results: [], loading: false, error: error ?? detail ?? "Search failed", searched: true });
    }
  }

  function clear(): void {
    setState({ results: [], loading: false, error: null, searched: false });
  }

  return { ...state, search, clear };
}

// ─── Formatting utilities ─────────────────────────────────────────────────────

/** Duration string is already formatted by backend ("3h 30m") — pass through */
export function parseDuration(d: string): string {
  return d ?? "";
}

/** ISO datetime → "HH:MM" */
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour:   "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export const CLASS_LABELS: Record<TravelClass, { ar: string; en: string }> = {
  economy:         { ar: "الدرجة السياحية",  en: "Economy" },
  premium_economy: { ar: "السياحية المميزة", en: "Premium Economy" },
  business:        { ar: "درجة الأعمال",     en: "Business" },
  first:           { ar: "الدرجة الأولى",    en: "First" },
};
