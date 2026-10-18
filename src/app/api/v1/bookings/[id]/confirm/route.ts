import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { AppError } from '@/lib/api/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const noteText: string = body.notes ?? 'Confirmed by staff';

    const { data: booking, error: fetchError } = await supabase
      .from(TABLES.travelRequests)
      .select('id, booking_status, client_user_id, booking_reference')
      .eq('id', id)
      .single();

    if (fetchError || !booking) return notFoundResponse('Booking');

    if (['confirmed', 'completed'].includes(booking.booking_status ?? ''))
      throw new AppError('Booking is already confirmed', 400);
    if (['cancelled', 'expired'].includes(booking.booking_status ?? ''))
      throw new AppError(`Cannot confirm a ${booking.booking_status} booking`, 400);

    const { data: updated, error: updateError } = await supabase
      .from(TABLES.travelRequests)
      .update({
        booking_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, booking_reference, booking_status, confirmed_at')
      .single();

    if (updateError) throw new AppError(updateError.message, 500);

    // Audit log — use real column names: customer_id, from_status, to_status, note
    await supabase.from(TABLES.portalStatusLog).insert({
      request_id: id,
      customer_id: booking.client_user_id ?? '',
      from_status: booking.booking_status ?? 'pending',
      to_status: 'confirmed',
      changed_by: user.id,
      note: noteText,
    });

    // In-app notification
    if (booking.client_user_id) {
      void supabase.from(TABLES.portalNotifications).insert({
        customer_id: booking.client_user_id,
        title: '✅ تم تأكيد حجزك',
        body: `تم تأكيد حجزك ${booking.booking_reference ?? id} بنجاح.`,
        type: 'booking_confirmed',
        travel_request_id: id,
      });
    }

    return successResponse(
      {
        booking_id: updated.id,
        reference: updated.booking_reference,
        status: updated.booking_status,
        confirmed_at: updated.confirmed_at,
      },
      'تم تأكيد الحجز بنجاح'
    );
  } catch (err) {
    return errorResponse(err as Error);
  }
}
