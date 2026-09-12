import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import type { Flight, FlightSearchParams } from '@/types/api';
import type { Json } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    const params: FlightSearchParams = {
      origin: searchParams.get('origin') || undefined,
      destination: searchParams.get('destination') || undefined,
      departureDate: searchParams.get('departureDate') || undefined,
      returnDate: searchParams.get('returnDate') || undefined,
      class: (searchParams.get('class') as 'economy' | 'business' | 'first') || undefined,
      passengers: searchParams.get('passengers') ? parseInt(searchParams.get('passengers')!) : undefined,
      tripType: (searchParams.get('tripType') as 'one-way' | 'round-trip') || undefined,
    };

    if (params.passengers && (params.passengers < 1 || params.passengers > 9)) {
      return validationErrorResponse('Passengers must be between 1 and 9');
    }
    if (params.class && !['economy', 'business', 'first'].includes(params.class)) {
      return validationErrorResponse('Class must be one of: economy, business, first');
    }
    if (params.departureDate) {
      const d = new Date(params.departureDate);
      if (isNaN(d.getTime())) return validationErrorResponse('Invalid departure date format');
      if (d < new Date()) return validationErrorResponse('Departure date cannot be in the past');
    }
    if (params.returnDate && params.departureDate) {
      if (new Date(params.returnDate) <= new Date(params.departureDate)) {
        return validationErrorResponse('Return date must be after departure date');
      }
    }

    const { data: flights, error } = await supabase.rpc('search_flights', {
      p_origin: params.origin ?? undefined,
      p_destination: params.destination ?? undefined,
      p_departure_date: params.departureDate ?? undefined,
      p_class: params.class ?? undefined,
      p_min_seats: params.passengers ?? undefined,
    });

    if (error) throw new AppError(`Flight search failed: ${error.message}`, 500);

    let returnFlights: Flight[] = [];
    if (params.tripType === 'round-trip' && params.returnDate && params.origin && params.destination) {
      const { data: rf, error: rfErr } = await supabase.rpc('search_flights', {
        p_origin: params.destination,
        p_destination: params.origin,
        p_departure_date: params.returnDate,
        p_class: params.class ?? undefined,
        p_min_seats: params.passengers ?? undefined,
      });
      if (!rfErr) returnFlights = (rf as unknown as Flight[]) || [];
    }

    const outbound = (flights as unknown as Flight[]) || [];

    return successResponse(
      { outbound, ...(params.tripType === 'round-trip' && { return: returnFlights }) },
      undefined,
      { count: outbound.length, ...(params.tripType === 'round-trip' && { return_count: returnFlights.length }) }
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
