import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { TABLES } from '@/lib/db/schema';
import type { BookingRequest, BookingResponse } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);
    
    const body = (await request.json()) as BookingRequest;

    if (!body.vertical || !body.data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vertical, data' },
        { status: 400 }
      );
    }

    const verticalPrefixes: Record<string, string> = {
      flight: 'FL',
      hotel:  'HT',
      visa:   'VI',
      trip:   'TR',
    };

    const prefix  = verticalPrefixes[body.vertical] ?? 'BK';
    const suffix  = Math.random().toString(36).substring(2, 8).toUpperCase();
    const ref     = `SPK-${prefix}-2026-${suffix}`;

    // Extract booking details
    const bookingData = body.data as any;
    const destinationCountry = 
      bookingData.destination || 
      bookingData.destination_country || 
      bookingData.country || 
      'Unknown';
    
    const travelType = 
      bookingData.travel_type || 
      (body.vertical === 'flight' ? 'visa_flight' : 
       body.vertical === 'hotel' ? 'visa_hotel' : 
       body.vertical === 'visa' ? 'visa_only' : 
       'full_package');

    // Save to database
    const { data: booking, error: bookingError } = await supabase
      .from(TABLES.travelRequests)
      .insert({
        client_user_id: user.id,
        user_id: user.id, // Alias for compatibility
        vertical: body.vertical,
        booking_status: 'pending_payment',
        status: 'pending_documents',
        booking_reference: ref,
        destination_country: destinationCountry,
        travel_type: travelType,
        total_amount: bookingData.total_amount || bookingData.price || 0,
        currency: bookingData.currency || 'EGP',
        contact: bookingData.contact || null,
        traveler_count: bookingData.travelers?.length || bookingData.passengers?.length || 1,
        departure_date: bookingData.departure_date || bookingData.check_in || null,
        return_date: bookingData.return_date || bookingData.check_out || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      console.error('[DB Insert Error]:', bookingError);
      throw new Error(`Failed to save booking: ${bookingError.message}`);
    }

    const response: BookingResponse = {
      booking_id: booking.id,
      reference:  ref,
      status:     'pending_payment',
      vertical:   body.vertical,
      total_amount: booking.total_amount || 0,
      currency:   booking.currency || 'EGP',
      expires_at: booking.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      created_at: booking.created_at || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Booking created successfully',
    });
  } catch (err) {
    console.error('[Booking API Error]:', err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
