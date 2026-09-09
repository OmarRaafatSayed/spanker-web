/**
 * POST /api/v1/bookings/:id/cancel
 * 
 * Cancel a booking and calculate refund
 * Requires authentication + ownership or staff access
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  requireOwnerOrStaff,
  successResponse,
  errorResponse,
  notFoundResponse,
  handleRPCError,
  ValidationError,
} from '@/lib/api';
import type { CancelBookingResponse } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/bookings/:id/cancel
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

    const supabase = createSupabaseServerClient();

    // 1. Get booking to check ownership
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('customer_id, status')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError) {
      console.error('[POST /api/v1/bookings/:id/cancel] Fetch error:', fetchError);
      throw new Error(`Failed to fetch booking: ${fetchError.message}`);
    }

    if (!booking) {
      return notFoundResponse('Booking');
    }

    // 2. Check ownership or staff access
    await requireOwnerOrStaff(booking.customer_id);

    // 3. Validate booking status
    if (booking.status === 'cancelled') {
      throw new ValidationError('Booking is already cancelled');
    }

    if (booking.status === 'completed') {
      throw new ValidationError('Cannot cancel completed booking');
    }

    if (booking.status === 'refunded') {
      throw new ValidationError('Booking is already refunded');
    }

    // 4. Parse request body for cancellation reason
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || null;

    // 5. Call cancel_booking RPC function
    const { data: result, error: rpcError } = await supabase.rpc('cancel_booking', {
      p_booking_id: bookingId,
      p_reason: reason,
    });

    if (rpcError) {
      console.error('[POST /api/v1/bookings/:id/cancel] RPC error:', rpcError);
      throw new Error(`Cancellation failed: ${rpcError.message}`);
    }

    // 6. Check RPC function response
    if (!result.ok) {
      handleRPCError(result);
    }

    return successResponse(
      result.data as CancelBookingResponse,
      'Booking cancelled successfully'
    );
  } catch (error) {
    console.error('[POST /api/v1/bookings/:id/cancel] Error:', error);
    return errorResponse(error as Error);
  }
}
