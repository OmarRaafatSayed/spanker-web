"use client";

import { useState } from "react";
import { searchFlights } from "@/lib/api";
import type { FlightOffer, FlightSearchRequest, TravelClass } from "@/types/flights";

export interface FlightSearchState {
  results: FlightOffer[];
  loading: boolean;
  error: string | null;
  searched: boolean;
}

export interface UseFlightSearchReturn extends FlightSearchState {
  search: (params: FlightSearchRequest) => Promise<void>;
  clear: () => void;
}

export function useFlightSearch(): UseFlightSearchReturn {
  const [state, setState] = useState<FlightSearchState>({
    results: [],
    loading: false,
    error: null,
    searched: false,
  });

  async function search(params: FlightSearchRequest) {
    setState({ results: [], loading: true, error: null, searched: false });
    try {
      const res = await searchFlights(params);
      if (res.success) {
        setState({
          results: res.flights ?? [],
          loading: false,
          error: null,
          searched: true,
        });
      } else {
        setState({
          results: [],
          loading: false,
          error: res.error ?? res.detail ?? "Search failed",
          searched: true,
        });
      }
    } catch (err) {
      setState({
        results: [],
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
        searched: true,
      });
    }
  }

  function clear() {
    setState({ results: [], loading: false, error: null, searched: false });
  }

  return { ...state, search, clear };
}

// "3h 30m" → already formatted by backend, return as-is
export function parseDuration(d: string): string {
  return d ?? "";
}

// ISO datetime → "HH:MM"
export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export const CLASS_LABELS: Record<TravelClass, { ar: string; en: string }> = {
  economy:         { ar: "الدرجة السياحية",   en: "Economy" },
  premium_economy: { ar: "السياحية المميزة",   en: "Premium Economy" },
  business:        { ar: "درجة الأعمال",       en: "Business" },
  first:           { ar: "الدرجة الأولى",      en: "First" },
};
