import { NextRequest, NextResponse } from 'next/server';
import { MOCK_HOTELS } from '@/lib/mock/data';
import type { HotelSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params: HotelSearchParams = {
    city:      searchParams.get('city')      || undefined,
    checkin:   searchParams.get('checkin')   || undefined,
    checkout:  searchParams.get('checkout')  || undefined,
    guests:    searchParams.get('guests')    ? parseInt(searchParams.get('guests')!)    : undefined,
    rooms:     searchParams.get('rooms')     ? parseInt(searchParams.get('rooms')!)     : undefined,
    room_type: (searchParams.get('room_type') as HotelSearchParams['room_type']) || undefined,
    min_stars: searchParams.get('min_stars') ? parseInt(searchParams.get('min_stars')!) : undefined,
    max_price: searchParams.get('max_price') ? parseInt(searchParams.get('max_price')!) : undefined,
  };

  // First: filter by city only
  const cityMatch = params.city
    ? MOCK_HOTELS.filter(h =>
        h.city.toLowerCase().includes(params.city!.toLowerCase())
      )
    : [...MOCK_HOTELS];

  // If city filter returned nothing, fall back to all hotels
  const cityPool = cityMatch.length > 0 ? cityMatch : [...MOCK_HOTELS];

  // Apply additional filters (stars, price, room_type)
  const filtered = cityPool.filter(h => {
    if (params.min_stars && h.star_rating < params.min_stars) return false;
    if (params.max_price && h.price_per_night > params.max_price) return false;
    if (params.room_type) {
      const hasRoom = h.availability?.some(
        a => a.room_type === params.room_type && a.rooms_left > 0
      );
      if (!hasRoom) return false;
    }
    return true;
  });

  // If strict filters return nothing, fall back to city pool only
  const results = filtered.length > 0 ? filtered : cityPool;

  // Sort: star_rating DESC, then price_per_night ASC
  const sorted = [...results].sort((a, b) => {
    if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
    return a.price_per_night - b.price_per_night;
  });

  return NextResponse.json({
    success: true,
    data: sorted,
    meta: { count: sorted.length },
  });
}
