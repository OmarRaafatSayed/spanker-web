/**
 * GET /api/v1/flights/search
 * 
 * Search for available flights with caching support
 * Public endpoint (no auth required)
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api';
import type { Flight, FlightSearchParams } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/flights/search
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: FlightSearchParams = {
      origin: searchParams.get('origin') || undefined,
      destination: searchParams.get('destination') || undefined,
      departureDate: searchParams.get('departureDate') || undefined,
      returnDate: searchParams.get('returnDate') || undefined,
      class: (searchParams.get('class') as 'economy' | 'business' | 'first') || undefined,
      passengers: searchParams.get('passengers')
        ? parseInt(searchParams.get('passengers')!)
        : undefined,
      tripType: (searchParams.get('tripType') as 'one-way' | 'round-trip') || undefined,
    };

    // Validate passengers count
    if (params.passengers && (params.passengers < 1 || params.passengers > 9)) {
      return validationErrorResponse(
        'Passengers must be between 1 and 9'
      );
    }

    // Validate class
    if (params.class && !['economy', 'business', 'first'].includes(params.class)) {
      return validationErrorResponse(
        'Class must be one of: economy, business, first'
      );
    }

    // Validate dates
    if (params.departureDate) {
      const departureDate = new Date(params.departureDate);
      if (isNaN(departureDate.getTime())) {
        return validationErrorResponse('Invalid departure date format');
      }
      // Check if departure is in the past
      if (departureDate < new Date()) {
        return validationErrorResponse('Departure date cannot be in the past');
      }
    }

    if (params.returnDate && params.departureDate) {
      const returnDate = new Date(params.returnDate);
      const departureDate = new Date(params.departureDate);
      if (returnDate <= departureDate) {
        return validationErrorResponse('Return date must be after departure date');
      }
    }

    // Call search_flights RPC function
    const { data: flights, error } = await supabase.rpc('search_flights', {
      p_origin: params.origin || null,
      p_destination: params.destination || null,
      p_departure_date: params.departureDate || null,
      p_class: params.class || null,
      p_min_seats: params.passengers || 1,
    });

    if (error) {
      console.error('[GET /api/v1/flights/search] RPC error:', error);
      throw new Error(`Flight search failed: ${error.message}`);
    }

    // Handle round-trip (search return flights if requested)
    let returnFlights: Flight[] = [];
    if (params.tripType === 'round-trip' && params.returnDate && params.origin && params.destination) {
      const { data: returnFlightsData, error: returnError } = await supabase.rpc(
        'search_flights',
        {
          p_origin: params.destination, // Swap origin/destination
          p_destination: params.origin,
          p_departure_date: params.returnDate,
          p_class: params.class || null,
          p_min_seats: params.passengers || 1,
        }
      );

      if (returnError) {
        console.error('[GET /api/v1/flights/search] Return flights error:', returnError);
      } else {
        returnFlights = returnFlightsData || [];
      }
    }

    // Format response
    const response = {
      outbound: (flights || []) as Flight[],
      ...(params.tripType === 'round-trip' && {
        return: returnFlights,
      }),
    };

    return successResponse(
      response,
      undefined,
      {
        count: response.outbound.length,
        ...(params.tripType === 'round-trip' && {
          return_count: returnFlights.length,
        }),
      }
    );
  } catch (error) {
    console.error('[GET /api/v1/flights/search] Error:', error);
    return errorResponse(error as Error);
  }
}
