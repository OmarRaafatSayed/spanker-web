/**
 * GET /api/v1/hotels/search
 * 
 * Search for available hotels with date-range availability check
 * Public endpoint (no auth required)
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api';
import type { Hotel, HotelSearchParams } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/hotels/search
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: HotelSearchParams = {
      city: searchParams.get('city') || undefined,
      checkin: searchParams.get('checkin') || undefined,
      checkout: searchParams.get('checkout') || undefined,
      guests: searchParams.get('guests')
        ? parseInt(searchParams.get('guests')!)
        : undefined,
      rooms: searchParams.get('rooms')
        ? parseInt(searchParams.get('rooms')!)
        : undefined,
      room_type: (searchParams.get('room_type') as 'standard' | 'deluxe' | 'suite') || undefined,
      min_stars: searchParams.get('min_stars')
        ? parseInt(searchParams.get('min_stars')!)
        : undefined,
      max_price: searchParams.get('max_price')
        ? parseFloat(searchParams.get('max_price')!)
        : undefined,
    };

    // Validate date range
    if (params.checkin && params.checkout) {
      const checkinDate = new Date(params.checkin);
      const checkoutDate = new Date(params.checkout);

      if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
        return validationErrorResponse('Invalid date format');
      }

      if (checkinDate >= checkoutDate) {
        return validationErrorResponse('Checkout date must be after checkin date');
      }

      if (checkinDate < new Date()) {
        return validationErrorResponse('Checkin date cannot be in the past');
      }
    }

    // Validate guests and rooms
    if (params.guests && (params.guests < 1 || params.guests > 20)) {
      return validationErrorResponse('Guests must be between 1 and 20');
    }

    if (params.rooms && (params.rooms < 1 || params.rooms > 10)) {
      return validationErrorResponse('Rooms must be between 1 and 10');
    }

    // Validate room type
    if (params.room_type && !['standard', 'deluxe', 'suite'].includes(params.room_type)) {
      return validationErrorResponse(
        'Room type must be one of: standard, deluxe, suite'
      );
    }

    // Validate star rating
    if (params.min_stars && (params.min_stars < 1 || params.min_stars > 5)) {
      return validationErrorResponse('Star rating must be between 1 and 5');
    }

    // Call search_hotels RPC function
    const { data: hotels, error } = await supabase.rpc('search_hotels', {
      p_city: params.city || null,
      p_checkin: params.checkin || null,
      p_checkout: params.checkout || null,
      p_room_type: params.room_type || 'standard',
      p_rooms_needed: params.rooms || 1,
      p_min_stars: params.min_stars || null,
      p_max_price: params.max_price || null,
    });

    if (error) {
      console.error('[GET /api/v1/hotels/search] RPC error:', error);
      throw new Error(`Hotel search failed: ${error.message}`);
    }

    return successResponse(
      (hotels || []) as Hotel[],
      undefined,
      {
        count: hotels?.length || 0,
        filters: {
          city: params.city,
          checkin: params.checkin,
          checkout: params.checkout,
          room_type: params.room_type || 'standard',
          rooms: params.rooms || 1,
        },
      }
    );
  } catch (error) {
    console.error('[GET /api/v1/hotels/search] Error:', error);
    return errorResponse(error as Error);
  }
}
