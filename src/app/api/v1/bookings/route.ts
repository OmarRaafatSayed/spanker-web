import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { handleRPCError, ValidationError, AppError } from '@/lib/api/errors';
import type {
  BookingRequest,
  BookingResponse,
  BookFlightRequest,
  BookHotelRequest,
  SubmitVisaApplicationRequest,
  BookTripRequest,
} from '@/types/api';
import type { Json } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    const body = (await request.json()) as BookingRequest;

    if (!body.vertical || !body.data) {
      return validationErrorResponse('Missing required fields: vertical, data');
    }

    const validVerticals = ['flight', 'hotel', 'visa', 'trip'];
    if (!validVerticals.includes(body.vertical)) {
      return validationErrorResponse(`Invalid vertical. Must be one of: ${validVerticals.join(', ')}`);
    }

    let bookingResult: BookingResponse;

    switch (body.vertical) {
      case 'flight':
        bookingResult = await bookFlight(user.id, body.data as BookFlightRequest);
        break;
      case 'hotel':
        bookingResult = await bookHotel(user.id, body.data as BookHotelRequest);
        break;
      case 'visa':
        bookingResult = await submitVisaApplication(user.id, body.data as SubmitVisaApplicationRequest);
        break;
      case 'trip':
        bookingResult = await bookTrip(user.id, body.data as BookTripRequest);
        break;
      default:
        return validationErrorResponse('Invalid booking vertical');
    }

    return successResponse(bookingResult, 'Booking created successfully');
  } catch (error) {
    return errorResponse(error as Error);
  }
}

async function bookFlight(userId: string, data: BookFlightRequest): Promise<BookingResponse> {
  const supabase = await createServerClient();

  if (!data.flight_id || !data.passengers || data.passengers.length === 0) {
    throw new ValidationError('Missing required fields: flight_id, passengers');
  }
  for (const p of data.passengers) {
    if (!p.first_name || !p.last_name || !p.date_of_birth || !p.passport_number || !p.passport_expiry) {
      throw new ValidationError('Each passenger must have: first_name, last_name, date_of_birth, passport_number, passport_expiry');
    }
  }
  if (!data.contact?.email || !data.contact?.phone) {
    throw new ValidationError('Contact email and phone are required');
  }

  const { data: result, error } = await supabase.rpc('create_flight_booking', {
    p_customer_id: userId,
    p_flight_id: data.flight_id,
    p_passengers: data.passengers as unknown as Json,
    p_contact: data.contact as unknown as Json,
    p_special_requests: data.special_requests ?? undefined,
  });

  if (error) throw new AppError(`Flight booking failed: ${error.message}`, 500);

  const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
  if (!rpcResult?.ok) handleRPCError(rpcResult);
  return rpcResult.data as unknown as BookingResponse;
}

async function bookHotel(userId: string, data: BookHotelRequest): Promise<BookingResponse> {
  const supabase = await createServerClient();

  if (!data.hotel_id || !data.checkin_date || !data.checkout_date || !data.room_type || !data.rooms_count || !data.guests?.length) {
    throw new ValidationError('Missing required fields: hotel_id, checkin_date, checkout_date, room_type, rooms_count, guests');
  }
  if (new Date(data.checkin_date) >= new Date(data.checkout_date)) {
    throw new ValidationError('Checkout date must be after checkin date');
  }
  for (const g of data.guests) {
    if (!g.first_name || !g.last_name) {
      throw new ValidationError('Each guest must have: first_name, last_name');
    }
  }
  if (!data.contact?.email || !data.contact?.phone) {
    throw new ValidationError('Contact email and phone are required');
  }

  const { data: result, error } = await supabase.rpc('create_hotel_booking', {
    p_customer_id: userId,
    p_hotel_id: data.hotel_id,
    p_checkin_date: data.checkin_date,
    p_checkout_date: data.checkout_date,
    p_room_type: data.room_type,
    p_rooms_count: data.rooms_count,
    p_guests: data.guests as unknown as Json,
    p_contact: data.contact as unknown as Json,
    p_special_requests: data.special_requests ?? undefined,
  });

  if (error) throw new AppError(`Hotel booking failed: ${error.message}`, 500);

  const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
  if (!rpcResult?.ok) handleRPCError(rpcResult);
  return rpcResult.data as unknown as BookingResponse;
}

async function submitVisaApplication(userId: string, data: SubmitVisaApplicationRequest): Promise<BookingResponse> {
  const supabase = await createServerClient();

  if (!data.visa_id || !data.applicant) {
    throw new ValidationError('Missing required fields: visa_id, applicant');
  }
  const a = data.applicant;
  if (!a.first_name || !a.last_name || !a.date_of_birth || !a.passport_number || !a.passport_expiry || !a.passport_issue_date || !a.nationality) {
    throw new ValidationError('Applicant must have: first_name, last_name, date_of_birth, passport_number, passport_expiry, passport_issue_date, nationality');
  }
  if (!data.contact?.email || !data.contact?.phone || !data.contact?.address || !data.contact?.city || !data.contact?.country) {
    throw new ValidationError('Contact must have: email, phone, address, city, country');
  }

  const { data: result, error } = await supabase.rpc('create_visa_booking', {
    p_customer_id: userId,
    p_visa_id: data.visa_id,
    p_applicant: data.applicant as unknown as Json,
    p_contact: data.contact as unknown as Json,
    p_travel_dates: (data.travel_dates as unknown as Json) ?? undefined,
    p_purpose_of_visit: data.purpose_of_visit ?? undefined,
    p_document_ids: (data.document_ids as unknown as Json) ?? undefined,
  });

  if (error) throw new AppError(`Visa application failed: ${error.message}`, 500);

  const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
  if (!rpcResult?.ok) handleRPCError(rpcResult);
  return rpcResult.data as unknown as BookingResponse;
}

async function bookTrip(userId: string, data: BookTripRequest): Promise<BookingResponse> {
  const supabase = await createServerClient();

  if (!data.trip_id || !data.travelers?.length) {
    throw new ValidationError('Missing required fields: trip_id, travelers');
  }
  for (const t of data.travelers) {
    if (!t.first_name || !t.last_name || !t.date_of_birth || !t.nationality) {
      throw new ValidationError('Each traveler must have: first_name, last_name, date_of_birth, nationality');
    }
  }
  if (!data.contact?.email || !data.contact?.phone) {
    throw new ValidationError('Contact email and phone are required');
  }

  const { data: result, error } = await supabase.rpc('create_trip_booking', {
    p_customer_id: userId,
    p_trip_id: data.trip_id,
    p_travelers: data.travelers as unknown as Json,
    p_contact: data.contact as unknown as Json,
    p_special_requests: data.special_requests ?? undefined,
    p_dietary_requirements: data.dietary_requirements ?? undefined,
  });

  if (error) throw new AppError(`Trip booking failed: ${error.message}`, 500);

  const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
  if (!rpcResult?.ok) handleRPCError(rpcResult);
  return rpcResult.data as unknown as BookingResponse;
}
