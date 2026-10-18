import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';

/**
 * GET /api/v1/bookings/[id]
 * Get booking details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);
    
    const { id } = await params;
    
    // Get booking with all details
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.travelRequests)
      .select(`
        *,
        profiles!travel_requests_client_user_id_fkey(
          id,
          email,
          first_name,
          last_name,
          phone
        ),
        flight_booking_details(*),
        hotel_booking_details(*),
        visa_booking_details(*),
        trip_booking_details(*)
      `)
      .eq('id', id)
      .single();
    
    if (bookingError || !booking) {
      return notFoundResponse('Booking');
    }
    
    // Check authorization - user can only see their own bookings, staff can see all
    const { data: profile } = await supabase
      .from(TABLES.profiles)
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    const isStaff = profile && ['staff', 'admin', 'agent', 'reviewer'].includes(profile.role);
    const isOwner = booking.client_user_id === user.id;
    
    if (!isStaff && !isOwner) {
      return errorResponse(new Error('Unauthorized'), 403);
    }
    
    // Format response — detail tables are 1:1 so select returns an object not an array
    const response = {
      ...booking,
      flight_details: Array.isArray(booking.flight_booking_details)
        ? (booking.flight_booking_details as any[])[0] ?? null
        : (booking.flight_booking_details as any) ?? null,
      hotel_details: Array.isArray(booking.hotel_booking_details)
        ? (booking.hotel_booking_details as any[])[0] ?? null
        : (booking.hotel_booking_details as any) ?? null,
      visa_details: Array.isArray(booking.visa_booking_details)
        ? (booking.visa_booking_details as any[])[0] ?? null
        : (booking.visa_booking_details as any) ?? null,
      trip_details: Array.isArray(booking.trip_booking_details)
        ? (booking.trip_booking_details as any[])[0] ?? null
        : (booking.trip_booking_details as any) ?? null,
    } as any;

    // Remove the raw nested keys
    delete response.flight_booking_details;
    delete response.hotel_booking_details;
    delete response.visa_booking_details;
    delete response.trip_booking_details;
    
    return successResponse(response);
  } catch (err) {
    console.error('[Get Booking Error]:', err);
    return errorResponse(err as Error);
  }
}
