import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRIPS } from '@/lib/mock/data';
import type { TripSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: TripSearchParams = {
    destination:   searchParams.get('destination')   || undefined,
    duration_days: searchParams.get('duration_days') ? parseInt(searchParams.get('duration_days')!) : undefined,
    min_price:     searchParams.get('min_price')     ? parseInt(searchParams.get('min_price')!)     : undefined,
    max_price:     searchParams.get('max_price')     ? parseInt(searchParams.get('max_price')!)     : undefined,
    difficulty:    (searchParams.get('difficulty') as TripSearchParams['difficulty']) || undefined,
  };

  let trips = MOCK_TRIPS.filter(t => {
    if (params.destination &&
        !t.destination.toLowerCase().includes(params.destination.toLowerCase())) return false;
    if (params.duration_days && t.duration_days !== params.duration_days) return false;
    if (params.min_price && t.price_per_person < params.min_price) return false;
    if (params.max_price && t.price_per_person > params.max_price) return false;
    if (params.difficulty && t.difficulty !== params.difficulty) return false;
    return true;
  });

  if (trips.length === 0) trips = MOCK_TRIPS;

  return NextResponse.json({
    success: true,
    data: trips,
    meta: { count: trips.length },
  });
}
