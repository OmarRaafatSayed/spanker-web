import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
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

  try {
    // ── Try live DB first ──────────────────────────────────────────────────
    const supabase = await createServerClient();

    let query = supabase
      .from('hotel_offers')
      .select('*')
      .eq('is_active', true)
      .eq('enabled', true)
      .order('hotel_rating', { ascending: false })
      .order('price_per_night', { ascending: true });

    if (params.city) {
      query = query.ilike('hotel_city', `%${params.city}%`);
    }
    if (params.min_stars) {
      query = query.gte('hotel_rating', params.min_stars);
    }
    if (params.max_price) {
      query = query.lte('price_per_night', params.max_price);
    }
    if (params.room_type) {
      query = query.eq('room_type', params.room_type);
    }
    if (params.checkin) {
      query = query.lte('available_from', params.checkin);
    }
    if (params.checkout) {
      query = query.gte('available_to', params.checkout);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0) {
      // Map hotel_offers rows → the shape the customer page expects
      const mapped = data.map(h => ({
        id:               h.id,
        name:             h.hotel_name,
        slug:             h.id,
        city:             h.hotel_city,
        country:          h.hotel_country,
        location:         h.hotel_location,
        star_rating:      h.hotel_rating ?? 3,
        hotel_category:   h.hotel_category,
        description:      h.description,
        amenities:        (h.amenities as string[]) ?? [],
        board_basis:      h.board_basis,
        room_type:        h.room_type,
        price_per_night:  h.price_per_night,
        special_offer_price: h.special_offer_price,
        currency:         h.price_currency,
        available_from:   h.available_from,
        available_to:     h.available_to,
        available_rooms:  h.available_rooms ?? 0,
        max_occupancy:    h.max_occupancy ?? 2,
        cancellation_policy: h.cancellation_policy,
        check_in_time:    '14:00',
        check_out_time:   '12:00',
        // Availability stub for room picker
        availability: h.available_rooms
          ? [{ room_type: h.room_type, rooms_left: h.available_rooms, price: h.price_per_night }]
          : [],
        // Compatibility with mock shape
        is_featured: false,
        is_public: true,
        enabled: h.enabled ?? true,
      }));

      return NextResponse.json({ success: true, data: mapped, meta: { count: mapped.length, source: 'db' } });
    }

    // ── Fallback to mock data if DB has no results ──────────────────────────
    const cityMatch = params.city
      ? MOCK_HOTELS.filter(h => h.city.toLowerCase().includes(params.city!.toLowerCase()))
      : [...MOCK_HOTELS];

    const cityPool = cityMatch.length > 0 ? cityMatch : [...MOCK_HOTELS];

    const filtered = cityPool.filter(h => {
      if (params.min_stars && h.star_rating < params.min_stars) return false;
      if (params.max_price && h.price_per_night > params.max_price) return false;
      if (params.room_type) {
        const hasRoom = h.availability?.some(
          (a: { room_type: string; rooms_left: number }) =>
            a.room_type === params.room_type && a.rooms_left > 0
        );
        if (!hasRoom) return false;
      }
      return true;
    });

    const results = filtered.length > 0 ? filtered : cityPool;
    const sorted  = [...results].sort((a, b) => {
      if (b.star_rating !== a.star_rating) return b.star_rating - a.star_rating;
      return a.price_per_night - b.price_per_night;
    });

    return NextResponse.json({ success: true, data: sorted, meta: { count: sorted.length, source: 'mock' } });

  } catch (err) {
    console.error('[hotels/search]', err);
    // Always fall back to mock on any error so the customer page still works
    return NextResponse.json({ success: true, data: MOCK_HOTELS, meta: { count: MOCK_HOTELS.length, source: 'mock-fallback' } });
  }
}
