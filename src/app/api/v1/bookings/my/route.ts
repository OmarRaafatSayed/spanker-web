/**
 * GET /api/v1/bookings/my
 * 
 * Get current user's bookings with optional filters
 * Requires authentication
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  requireUser,
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api';
import type { BookingDetails, BookingListParams, BookingStatus, BookingVertical } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GET /api/v1/bookings/my
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireUser();

    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const params: BookingListParams = {
      status: (searchParams.get('status') as BookingStatus) || undefined,
      vertical: (searchParams.get('vertical') as BookingVertical) || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    };

    // Validate status
    const validStatuses = ['draft', 'pending', 'confirmed', 'cancelled', 'expired', 'refunded', 'completed'];
    if (params.status && !validStatuses.includes(params.status)) {
      return validationErrorResponse(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      );
    }

    // Validate vertical
    const validVerticals = ['flight', 'hotel', 'visa', 'trip'];
    if (params.vertical && !validVerticals.includes(params.vertical)) {
      return validationErrorResponse(
        `Invalid vertical. Must be one of: ${validVerticals.join(', ')}`
      );
    }

    // Validate pagination
    if (params.page && params.page < 1) {
      return validationErrorResponse('Page must be >= 1');
    }

    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      return validationErrorResponse('Limit must be between 1 and 100');
    }

    // Build query
    let query = supabase
      .from("travel_requests")
      .select('*, payment:payments(*)', { count: 'exact' })
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.vertical) {
      query = query.eq('vertical', params.vertical);
    }

    if (params.from_date) {
      query = query.gte('created_at', params.from_date);
    }

    if (params.to_date) {
      query = query.lte('created_at', params.to_date);
    }

    // Apply pagination
    const from = (params.page! - 1) * params.limit!;
    const to = from + params.limit! - 1;
    query = query.range(from, to);

    // Execute query
    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('[GET /api/v1/bookings/my] Query error:', error);
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    // Load vertical-specific details for each booking
    const bookingsWithDetails = await Promise.all(
      (bookings || []).map(async (booking) => {
        return await loadBookingDetails(supabase, booking);
      })
    );

    return successResponse(
      bookingsWithDetails as BookingDetails[],
      undefined,
      {
        page: params.page!,
        limit: params.limit!,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / params.limit!),
      }
    );
  } catch (error) {
    console.error('[GET /api/v1/bookings/my] Error:', error);
    return errorResponse(error as Error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: Load Booking Details
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function loadBookingDetails(supabase: any, booking: any): Promise<BookingDetails> {
  const baseBooking: BookingDetails = {
    booking_id: booking.id,
    reference: booking.reference,
    status: booking.status,
    vertical: booking.vertical,
    total_amount: booking.total_amount,
    currency: booking.currency,
    expires_at: booking.expires_at,
    payment_id: booking.payment_id,
    created_at: booking.created_at,
    customer_id: booking.customer_id,
    contact: booking.contact,
  };

  // Load vertical-specific details
  switch (booking.vertical) {
    case 'flight': {
      const { data: flightDetails } = await supabase
        .from('flight_booking_details')
        .select('*, flight:flights(*)')
        .eq('booking_id', booking.id)
        .maybeSingle();

      if (flightDetails) {
        baseBooking.flight_details = {
          flight_id: flightDetails.flight_id,
          airline: flightDetails.flight.airline,
          flight_number: flightDetails.flight.flight_number,
          origin: flightDetails.flight.origin_city,
          destination: flightDetails.flight.destination_city,
          departure_at: flightDetails.flight.departure_at,
          arrival_at: flightDetails.flight.arrival_at,
          passengers: flightDetails.passengers,
        };
      }
      break;
    }

    case 'hotel': {
      const { data: hotelDetails } = await supabase
        .from('hotel_booking_details')
        .select('*, hotel:hotels(name, city)')
        .eq('booking_id', booking.id)
        .maybeSingle();

      if (hotelDetails) {
        baseBooking.hotel_details = {
          hotel_id: hotelDetails.hotel_id,
          hotel_name: hotelDetails.hotel.name,
          city: hotelDetails.hotel.city,
          checkin_date: hotelDetails.checkin_date,
          checkout_date: hotelDetails.checkout_date,
          nights: hotelDetails.nights,
          room_type: hotelDetails.room_type,
          rooms_count: hotelDetails.rooms_count,
          guests: hotelDetails.guests,
        };
      }
      break;
    }

    case 'visa': {
      const { data: visaDetails } = await supabase
        .from('visa_booking_details')
        .select('*, visa:visas(destination_country, visa_type)')
        .eq('booking_id', booking.id)
        .maybeSingle();

      if (visaDetails) {
        baseBooking.visa_details = {
          visa_id: visaDetails.visa_id,
          destination_country: visaDetails.visa.destination_country,
          visa_type: visaDetails.visa.visa_type,
          applicant_name: `${visaDetails.applicant.first_name} ${visaDetails.applicant.last_name}`,
          passport_number: visaDetails.applicant.passport_number,
          review_status: visaDetails.review_status,
          submitted_at: visaDetails.submitted_at,
        };
      }
      break;
    }

    case 'trip': {
      const { data: tripDetails } = await supabase
        .from('trip_booking_details')
        .select('*, trip:trips(title_en, destination, start_date, end_date)')
        .eq('booking_id', booking.id)
        .maybeSingle();

      if (tripDetails) {
        baseBooking.trip_details = {
          trip_id: tripDetails.trip_id,
          trip_title: tripDetails.trip.title_en,
          destination: tripDetails.trip.destination,
          start_date: tripDetails.trip.start_date,
          end_date: tripDetails.trip.end_date,
          travelers_count: tripDetails.travelers.length,
          travelers: tripDetails.travelers,
        };
      }
      break;
    }
  }

  return baseBooking;
}