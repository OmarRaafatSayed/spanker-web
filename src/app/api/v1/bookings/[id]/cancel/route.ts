import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireOwnerOrStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { handleRPCError, ValidationError, AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import type { CancelBookingResponse } from '@/types/api';
import type { Json } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    if (!bookingId) throw new ValidationError('Booking ID is required');

    const supabase = await createServerClient();

    const { data: booking, error: fetchError } = await supabase
      .from(TABLES.travelRequests)
      .select('client_user_id, booking_status')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError) throw new AppError(`Failed to fetch booking: ${fetchError.message}`, 500);
    if (!booking) return notFoundResponse('Booking');

    await requireOwnerOrStaff(supabase, booking.client_user_id ?? '');

    const status = booking.booking_status ?? '';
    if (status === 'cancelled') throw new ValidationError('Booking is already cancelled');
    if (status === 'completed') throw new ValidationError('Cannot cancel completed booking');
    if (status === 'refunded') throw new ValidationError('Booking is already refunded');

    const body = await request.json().catch(() => ({}));
    const reason: string | null = (body as Record<string, string>).reason ?? null;

    const { data: result, error: rpcError } = await supabase.rpc('cancel_booking', {
      p_request_id: bookingId,
      p_reason: reason ?? undefined,
    });

    if (rpcError) throw new AppError(`Cancellation failed: ${rpcError.message}`, 500);

    const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
    if (!rpcResult?.ok) handleRPCError(rpcResult);

    return successResponse(rpcResult.data as unknown as CancelBookingResponse, 'Booking cancelled successfully');
  } catch (error) {
    return errorResponse(error as Error);
  }
}
