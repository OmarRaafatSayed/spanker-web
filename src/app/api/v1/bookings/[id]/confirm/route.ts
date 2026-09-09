/**
 * POST /api/v1/bookings/:id/confirm
 * 
 * Confirm a booking (staff only)
 * Clears expires_at and updates status to confirmed
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  requireStaff,
  successResponse,
  errorResponse,
  notFoundResponse,
  handleRPCError,
  ValidationError,
} from '@/lib/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/bookings/:id/confirm
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    if (!bookingId) {
      throw new ValidationError('Booking ID is required');
    }

    // 1. Require staff access (admin or agent)
    const staff = await requireStaff(['admin', 'agent']);

    const supabase = createSupabaseServerClient();

    // 2. Check if booking exists
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status, reference')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError) {
      console.error('[POST /api/v1/bookings/:id/confirm] Fetch error:', fetchError);
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    if (!booking) {
      return notFoundResponse('Booking');
    }

    // 3. Validate booking status
    if (booking.status === 'confirmed') {
      throw new ValidationError('Booking is already confirmed');
    }

    if (booking.status === 'cancelled') {
      throw new ValidationError('Cannot confirm cancelled booking');
    }

    if (booking.status === 'refunded') {
      throw new ValidationError('Cannot confirm refunded booking');
    }

    if (booking.status === 'expired') {
      throw new ValidationError('Cannot confirm expired booking');
    }

    // 4. Parse request body for notes
    const body = await request.json().catch(() => ({}));
    const notes = body.notes || null;

    // 5. Call confirm_booking RPC function
    const { data: result, error: rpcError } = await supabase.rpc('confirm_booking', {
      p_booking_id: bookingId,
      p_notes: notes,
    });

    if (rpcError) {
      console.error('[POST /api/v1/bookings/:id/confirm] RPC error:', rpcError);
      throw new Error(`Confirmation failed: ${rpcError.message}`);
    }

    // 6. Check RPC function response
    if (!result.ok) {
      handleRPCError(result);
    }

    return successResponse(
      {
        booking_id: bookingId,
        status: 'confirmed',
        confirmed_by: staff.id,
        confirmed_at: new Date().toISOString(),
        reference: booking.reference,
      },
      'Booking confirmed successfully'
    );
  } catch (error) {
    console.error('[POST /api/v1/bookings/:id/confirm] Error:', error);
    return errorResponse(error as Error);
  }
}
