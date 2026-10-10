/**
 * gfly Integration - Real Google Flights Data
 * Uses the gfly CLI tool (Python-based) to fetch actual flight data
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GflySearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers?: number;
  cabin?: "economy" | "premium" | "business" | "first";
  stops?: "any" | "nonstop" | "max-1" | "max-2";
}

export interface GflyFlight {
  price: number;
  currency: string;
  isBest: boolean;
  stops: number;
  durationMinutes: number;
  departure: string; // ISO 8601
  arrival: string; // ISO 8601
  origin: string;
  destination: string;
  airlines: string[];
  flightNumbers: string[];
  layovers: Array<{
    airport: string;
    minutes: number;
  }>;
  co2Grams: number;
  co2DeltaPct: number;
  bookingToken: string | null;
}

export interface GflySearchResult {
  schemaVersion: string;
  backend: string;
  query: {
    from: string;
    to: string;
    depart: string;
    return: string | null;
    adults: number;
    children: number;
    infants: number;
    cabin: string;
    stops: string;
  };
  currency: string;
  count: number;
  offset: number;
  itineraries: GflyFlight[];
}

export interface FlightSearchResult {
  flights: GflyFlight[];
  count: number;
  currency: string;
}

/**
 * Search for flights using gfly CLI
 */
export async function searchFlights(
  params: GflySearchParams
): Promise<FlightSearchResult> {
  const {
    origin,
    destination,
    departDate,
    returnDate,
    passengers = 1,
    cabin = "economy",
    stops = "any",
  } = params;

  // Build gfly command
  const args = [
    "search",
    origin.toUpperCase(),
    destination.toUpperCase(),
    "--depart",
    departDate,
    "--json",
    "--cabin",
    cabin,
    "--stops",
    stops === "nonstop" ? "nonstop" : stops === "max-1" ? "max-1" : "any",
  ];

  if (returnDate) {
    args.push("--return", returnDate);
  }

  if (passengers > 1) {
    args.push("--adults", passengers.toString());
  }

  // Add rate limiting - wait flag to respect gfly's throttle
  args.push("--wait");

  const command = `gfly ${args.join(" ")}`;

  try {
    // Execute gfly command with timeout
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 seconds timeout
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    });

    // gfly outputs warnings/errors to stderr, actual data to stdout
    if (stderr) {
      console.warn("gfly warnings:", stderr);
    }

    // Parse JSON response
    const result: GflySearchResult = JSON.parse(stdout);

    return {
      flights: result.itineraries || [],
      count: result.count || 0,
      currency: result.currency || "USD",
    };
  } catch (error: any) {
    // Handle gfly specific errors
    if (error.code === "ENOENT") {
      throw new Error(
        "gfly CLI not found. Please install it: pip install gfly"
      );
    }

    if (error.killed) {
      throw new Error("Flight search timeout - gfly took too long to respond");
    }

    // Try to parse error output for structured errors
    if (error.stderr) {
      try {
        const errorData = JSON.parse(error.stderr);
        if (errorData.error) {
          throw new Error(`gfly error: ${errorData.error}`);
        }
      } catch {
        // Not JSON, just throw the stderr
        throw new Error(`gfly error: ${error.stderr}`);
      }
    }

    throw new Error(`Flight search failed: ${error.message}`);
  }
}

/**
 * Search for cheapest dates in a date range using gfly
 */
export async function searchDates(params: {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration?: number;
  roundTrip?: boolean;
  cabin?: string;
}): Promise<any> {
  const {
    origin,
    destination,
    startDate,
    endDate,
    duration = 3,
    roundTrip = true,
    cabin = "economy",
  } = params;

  const args = [
    "dates",
    origin.toUpperCase(),
    destination.toUpperCase(),
    "--from",
    startDate,
    "--to",
    endDate,
    "--json",
    "--cabin",
    cabin,
  ];

  if (roundTrip) {
    args.push("--round", "--duration", duration.toString());
  }

  args.push("--wait");

  const command = `gfly ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minutes for date searches
      maxBuffer: 1024 * 1024 * 10,
    });

    if (stderr) {
      console.warn("gfly warnings:", stderr);
    }

    return JSON.parse(stdout);
  } catch (error: any) {
    throw new Error(`Date search failed: ${error.message}`);
  }
}
