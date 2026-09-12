import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import type { Hotel, HotelSearchParams } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    const params: HotelSearchParams = {
      city: searchParams.get('city') || undefined,
      checkin: searchParams.get('checkin') || undefined,
      checkout: searchParams.get('checkout') || undefined,
      guests: searchParams.get('guests') ? parseInt(searchParams.get('guests')!) : undefined,
      rooms: searchParams.get('rooms') ? parseInt(searchParams.get('rooms')!) : undefined,
      room_type: (searchParams.get('room_type') as 'standard' | 'deluxe' | 'suite') || undefined,
      min_stars: searchParams.get('min_stars') ? parseInt(searchParams.get('min_stars')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
    };

    if (params.checkin && params.checkout) {
      const ci = new Date(params.checkin);
      const co = new Date(params.checkout);
      if (isNaN(ci.getTime()) || isNaN(co.getTime())) return validationErrorResponse('Invalid date format');
      if (ci >= co) return validationErrorResponse('Checkout date must be after checkin date');
      if (ci < new Date()) return validationErrorResponse('Checkin date cannot be in the past');
    }
    if (params.guests && (params.guests < 1 || params.guests > 20)) return validationErrorResponse('Guests must be between 1 and 20');
    if (params.rooms && (params.rooms < 1 || params.rooms > 10)) return validationErrorResponse('Rooms must be between 1 and 10');
    if (params.min_stars && (params.min_stars < 1 || params.min_stars > 5)) return validationErrorResponse('Star rating must be between 1 and 5');

    const { data: hotels, error } = await supabase.rpc('search_hotels', {
      p_city: params.city ?? undefined,
      p_checkin: params.checkin ?? undefined,
      p_checkout: params.checkout ?? undefined,
      p_room_type: params.room_type ?? undefined,
      p_rooms_needed: params.rooms ?? undefined,
      p_min_stars: params.min_stars ?? undefined,
      p_max_price: params.max_price ?? undefined,
    });

    if (error) throw new AppError(`Hotel search failed: ${error.message}`, 500);

    return successResponse(
      (hotels as unknown as Hotel[]) || [],
      undefined,
      { count: (hotels as unknown[])?.length || 0 }
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
