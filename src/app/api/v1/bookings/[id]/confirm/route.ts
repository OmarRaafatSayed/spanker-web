import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { handleRPCError, ValidationError, AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import type { Json } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    if (!bookingId) throw new ValidationError('Booking ID is required');

    const staff = await requireStaff(['admin', 'agent']);
    const supabase = await createServerClient();

    const { data: booking, error: fetchError } = await supabase
      .from(TABLES.travelRequests)
      .select('id, booking_status, booking_reference')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError) throw new AppError(`Failed to fetch booking: ${fetchError.message}`, 500);
    if (!booking) return notFoundResponse('Booking');

    const status = booking.booking_status ?? '';
    if (status === 'confirmed') throw new ValidationError('Booking is already confirmed');
    if (status === 'cancelled') throw new ValidationError('Cannot confirm cancelled booking');
    if (status === 'refunded') throw new ValidationError('Cannot confirm refunded booking');
    if (status === 'expired') throw new ValidationError('Cannot confirm expired booking');

    const body = await request.json().catch(() => ({}));
    const notes: string | null = (body as Record<string, string>).notes ?? null;

    const { data: result, error: rpcError } = await supabase.rpc('confirm_booking', {
      p_request_id: bookingId,
      p_staff_uid: staff.id,
    });

    if (rpcError) throw new AppError(`Confirmation failed: ${rpcError.message}`, 500);

    const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
    if (!rpcResult?.ok) handleRPCError(rpcResult);

    return successResponse(
      {
        booking_id: bookingId,
        status: 'confirmed',
        confirmed_by: staff.id,
        confirmed_at: new Date().toISOString(),
        reference: booking.booking_reference,
        notes,
      },
      'Booking confirmed successfully'
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
