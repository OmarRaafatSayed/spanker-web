/**
 * POST /api/v1/bookings
 * 
 * Unified booking endpoint for all 4 verticals (flight/hotel/visa/trip)
 * Routes to appropriate RPC function based on vertical discriminator
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  requireUser,
  requireCompleteProfile,
  successResponse,
  errorResponse,
  validationErrorResponse,
  handleRPCError,
  ValidationError,
} from '@/lib/api';
import type { BookingRequest, BookingResponse } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/bookings - Create Booking
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await requireUser();

    // 2. Check profile completeness
    await requireCompleteProfile(user.id);

    // 3. Parse request body
    const body = (await request.json()) as BookingRequest;

    if (!body.vertical || !body.data) {
      return validationErrorResponse('Missing required fields: vertical, data');
    }

    // 4. Validate vertical
    const validVerticals = ['flight', 'hotel', 'visa', 'trip'];
    if (!validVerticals.includes(body.vertical)) {
      return validationErrorResponse(
        `Invalid vertical. Must be one of: ${validVerticals.join(', ')}`
      );
    }

    // 5. Route to appropriate booking handler
    let bookingResult: BookingResponse;

    switch (body.vertical) {
      case 'flight':
        bookingResult = await bookFlight(user.id, body.data);
        break;

      case 'hotel':
        bookingResult = await bookHotel(user.id, body.data);
        break;

      case 'visa':
        bookingResult = await submitVisaApplication(user.id, body.data);
        break;

      case 'trip':
        bookingResult = await bookTrip(user.id, body.data);
        break;

      default:
        return validationErrorResponse('Invalid booking vertical');
    }

    // 6. Return success response
    return successResponse(bookingResult, 'Booking created successfully');
  } catch (error) {
    console.error('[POST /api/v1/bookings] Error:', error);
    return errorResponse(error as Error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Flight Booking Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function bookFlight(
  userId: string,
  data: BookingRequest extends { vertical: 'flight' } ? BookingRequest['data'] : never
): Promise<BookingResponse> {
  const supabase = await createSupabaseServerClient();

  // Validate required fields
  if (!data.flight_id || !data.passengers || data.passengers.length === 0) {
    throw new ValidationError('Missing required fields: flight_id, passengers');
  }

  // Validate passengers data
  for (const passenger of data.passengers) {
    if (
      !passenger.first_name ||
      !passenger.last_name ||
      !passenger.date_of_birth ||
      !passenger.passport_number ||
      !passenger.passport_expiry
    ) {
      throw new ValidationError(
        'Each passenger must have: first_name, last_name, date_of_birth, passport_number, passport_expiry'
      );
    }
  }

  // Validate contact info
  if (!data.contact?.email || !data.contact?.phone) {
    throw new ValidationError('Contact email and phone are required');
  }

  // Call book_flight RPC function
  const { data: result, error } = await supabase.rpc('book_flight', {
    p_customer_id: userId,
    p_flight_id: data.flight_id,
    p_passengers: data.passengers,
    p_contact: data.contact,
    p_special_requests: data.special_requests || null,
  });

  if (error) {
    console.error('[bookFlight] RPC error:', error);
    throw new Error(`Flight booking failed: ${error.message}`);
  }

  // Check RPC function response
  if (!result.ok) {
    handleRPCError(result);
  }

  return result.data as BookingResponse;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hotel Booking Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function bookHotel(
  userId: string,
  data: BookingRequest extends { vertical: 'hotel' } ? BookingRequest['data'] : never
): Promise<BookingResponse> {
  const supabase = await createSupabaseServerClient();

  // Validate required fields
  if (
    !data.hotel_id ||
    !data.checkin_date ||
    !data.checkout_date ||
    !data.room_type ||
    !data.rooms_count ||
    !data.guests ||
    data.guests.length === 0
  ) {
    throw new ValidationError(
      'Missing required fields: hotel_id, checkin_date, checkout_date, room_type, rooms_count, guests'
    );
  }

  // Validate date range
  const checkin = new Date(data.checkin_date);
  const checkout = new Date(data.checkout_date);
  if (checkin >= checkout) {
    throw new ValidationError('Checkout date must be after checkin date');
  }

  // Validate guests data
  for (const guest of data.guests) {
    if (!guest.first_name || !guest.last_name) {
      throw new ValidationError(
        'Each guest must have: first_name, last_name'
      );
    }
  }

  // Validate contact info
  if (!data.contact?.email || !data.contact?.phone) {
    throw new ValidationError('Contact email and phone are required');
  }

  // Call book_hotel RPC function
  const { data: result, error } = await supabase.rpc('book_hotel', {
    p_customer_id: userId,
    p_hotel_id: data.hotel_id,
    p_checkin_date: data.checkin_date,
    p_checkout_date: data.checkout_date,
    p_room_type: data.room_type,
    p_rooms_count: data.rooms_count,
    p_guests: data.guests,
    p_contact: data.contact,
    p_special_requests: data.special_requests || null,
  });

  if (error) {
    console.error('[bookHotel] RPC error:', error);
    throw new Error(`Hotel booking failed: ${error.message}`);
  }

  // Check RPC function response
  if (!result.ok) {
    handleRPCError(result);
  }

  return result.data as BookingResponse;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Visa Application Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function submitVisaApplication(
  userId: string,
  data: BookingRequest extends { vertical: 'visa' } ? BookingRequest['data'] : never
): Promise<BookingResponse> {
  const supabase = await createSupabaseServerClient();

  // Validate required fields
  if (!data.visa_id || !data.applicant) {
    throw new ValidationError('Missing required fields: visa_id, applicant');
  }

  // Validate applicant data
  const applicant = data.applicant;
  if (
    !applicant.first_name ||
    !applicant.last_name ||
    !applicant.date_of_birth ||
    !applicant.passport_number ||
    !applicant.passport_expiry ||
    !applicant.passport_issue_date ||
    !applicant.nationality
  ) {
    throw new ValidationError(
      'Applicant must have: first_name, last_name, date_of_birth, passport_number, passport_expiry, passport_issue_date, nationality'
    );
  }

  // Validate contact info
  if (
    !data.contact?.email ||
    !data.contact?.phone ||
    !data.contact?.address ||
    !data.contact?.city ||
    !data.contact?.country
  ) {
    throw new ValidationError(
      'Contact must have: email, phone, address, city, country'
    );
  }

  // Call submit_visa_application RPC function
  const { data: result, error } = await supabase.rpc('submit_visa_application', {
    p_customer_id: userId,
    p_visa_id: data.visa_id,
    p_applicant: applicant,
    p_contact: data.contact,
    p_travel_dates: data.travel_dates || null,
    p_purpose_of_visit: data.purpose_of_visit || null,
    p_document_ids: data.document_ids || null,
  });

  if (error) {
    console.error('[submitVisaApplication] RPC error:', error);
    throw new Error(`Visa application failed: ${error.message}`);
  }

  // Check RPC function response
  if (!result.ok) {
    handleRPCError(result);
  }

  return result.data as BookingResponse;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Trip Booking Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function bookTrip(
  userId: string,
  data: BookingRequest extends { vertical: 'trip' } ? BookingRequest['data'] : never
): Promise<BookingResponse> {
  const supabase = await createSupabaseServerClient();

  // Validate required fields
  if (
    !data.trip_id ||
    !data.travelers ||
    data.travelers.length === 0
  ) {
    throw new ValidationError(
      'Missing required fields: trip_id, travelers'
    );
  }

  // Validate travelers data
  for (const traveler of data.travelers) {
    if (
      !traveler.first_name ||
      !traveler.last_name ||
      !traveler.date_of_birth ||
      !traveler.nationality
    ) {
      throw new ValidationError(
        'Each traveler must have: first_name, last_name, date_of_birth, nationality'
      );
    }
  }

  // Validate contact info
  if (!data.contact?.email || !data.contact?.phone) {
    throw new ValidationError('Contact email and phone are required');
  }

  // Call book_trip RPC function
  const { data: result, error } = await supabase.rpc('book_trip', {
    p_customer_id: userId,
    p_trip_id: data.trip_id,
    p_travelers: data.travelers,
    p_contact: data.contact,
    p_special_requests: data.special_requests || null,
    p_dietary_requirements: data.dietary_requirements || null,
  });

  if (error) {
    console.error('[bookTrip] RPC error:', error);
    throw new Error(`Trip booking failed: ${error.message}`);
  }

  // Check RPC function response
  if (!result.ok) {
    handleRPCError(result);
  }

  return result.data as BookingResponse;
}
