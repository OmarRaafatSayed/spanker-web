"use client";

import { useState } from "react";
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

    try {
      const query = new URLSearchParams();
      if (params.origin)       query.set("origin",        params.origin);
      if (params.destination)  query.set("destination",   params.destination);
      if (params.departure_date) query.set("departure_date", params.departure_date);
      if (params.return_date)   query.set("return_date",   params.return_date);
      if (params.passenger_count)   query.set("passengers",String(params.passenger_count));
      if (params.travel_class)  query.set("travel_class",  params.travel_class);

      const res = await fetch(`/api/v1/flights/search?${query}`);

      if (res.status === 503 || res.status === 502 || res.status === 504) {
        console.warn("[useFlightSearch] Service temporarily unavailable");
        setState({ results: [], loading: false, error: null, searched: true });
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        setState({ results: [], loading: false, error: json.error?.message ?? "Search failed", searched: true });
        return;
      }

      if (json.success) {
        setState({ results: json.data?.flights ?? json.flights ?? [], loading: false, error: null, searched: true });
      } else {
        setState({ results: [], loading: false, error: json.error ?? "Search failed", searched: true });
      }
    } catch (err: unknown) {
      setState({ results: [], loading: false, error: (err as Error)?.message ?? "Search failed", searched: true });
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
