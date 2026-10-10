import { NextRequest } from "next/server";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from "@/lib/api/response";
import { searchFlights } from "@/lib/flight-search/gfly";

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after testing
    // const supabase = await createServerClient();
    // const user = await requireUser(supabase);

    const body = await request.json();
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      cabinClass = "economy",
      stops = "any",
    } = body;

    // Validation
    if (!origin || !destination || !departureDate) {
      return validationErrorResponse(
        "Missing required fields: origin, destination, departureDate"
      );
    }

    // Search real flights using gfly
    const results = await searchFlights({
      origin,
      destination,
      departDate: departureDate,
      returnDate,
      passengers,
      cabin: cabinClass,
      stops,
    });

    return successResponse({
      flights: results.flights,
      count: results.count,
      currency: results.currency,
      searchParams: {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass,
        stops,
      },
    });
  } catch (err: any) {
    console.error("Flight search error:", err);
    return errorResponse(err as Error);
  }
}
