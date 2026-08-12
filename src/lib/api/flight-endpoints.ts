import type { FlightSearchRequest, FlightSearchResponse } from "@/types/flights";
import { apiFetch } from "./api-utils";

export async function searchFlights(params: FlightSearchRequest): Promise<FlightSearchResponse> {
  try {
    return await apiFetch<FlightSearchResponse>("/flights/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    return {
      success: false,
      error: (e?.detail as string) ?? (e?.message as string) ?? "Flight search failed",
    };
  }
}
