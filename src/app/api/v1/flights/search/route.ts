import { NextRequest, NextResponse } from 'next/server';
import { MOCK_FLIGHTS } from '@/lib/mock/data';
import type { FlightSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: FlightSearchParams = {
    origin:        searchParams.get('origin')        || undefined,
    destination:   searchParams.get('destination')   || undefined,
    departureDate: searchParams.get('departureDate') || undefined,
    returnDate:    searchParams.get('returnDate')    || undefined,
    class:         (searchParams.get('class') as FlightSearchParams['class']) || undefined,
    passengers:    searchParams.get('passengers') ? parseInt(searchParams.get('passengers')!) : undefined,
    tripType:      (searchParams.get('tripType') as FlightSearchParams['tripType']) || undefined,
  };

  // Filter mock flights by origin/destination if provided
  let outbound = MOCK_FLIGHTS.filter(f => {
    if (params.origin && !f.origin_iata.toLowerCase().includes(params.origin.toLowerCase()) &&
        !f.origin_city.toLowerCase().includes(params.origin.toLowerCase())) return false;
    if (params.destination && !f.destination_iata.toLowerCase().includes(params.destination.toLowerCase()) &&
        !f.destination_city.toLowerCase().includes(params.destination.toLowerCase())) return false;
    if (params.class && f.class !== params.class) return false;
    return true;
  });

  // If no filter matches, return all flights (demo UX)
  if (outbound.length === 0) outbound = MOCK_FLIGHTS;

  const returnFlights = params.tripType === 'round-trip' ? outbound.map(f => ({
    ...f,
    id: `${f.id}-return`,
    origin_iata: f.destination_iata,
    origin_city: f.destination_city,
    destination_iata: f.origin_iata,
    destination_city: f.origin_city,
  })) : [];

  return NextResponse.json({
    success: true,
    data: {
      outbound,
      ...(params.tripType === 'round-trip' && { return: returnFlights }),
    },
    meta: {
      count: outbound.length,
      ...(params.tripType === 'round-trip' && { return_count: returnFlights.length }),
    },
  });
}
