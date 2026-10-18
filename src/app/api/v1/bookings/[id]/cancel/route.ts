import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { AppError } from '@/lib/api/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason: string = body.reason ?? 'Cancelled by user';

    const { data: booking, error: fetchError } = await supabase
      .from(TABLES.travelRequests)
      .select('id, booking_status, client_user_id, booking_reference, departure_date, total_amount')
      .eq('id', id)
      .single();

    if (fetchError || !booking) return notFoundResponse('Booking');

    // Authorization: owner or staff
    const { data: staffProfile } = await supabase
      .from(TABLES.profiles)
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isStaff = staffProfile && ['staff', 'admin'].includes(staffProfile.role);
    const isOwner = booking.client_user_id === user.id;
    if (!isStaff && !isOwner) throw new AppError('Unauthorized to cancel this booking', 403);

    if (booking.booking_status === 'cancelled') throw new AppError('Booking is already cancelled', 400);
    if (booking.booking_status === 'completed') throw new AppError('Cannot cancel a completed booking', 400);

    // Refund policy
    let refundAmount = 0;
    if (booking.departure_date && booking.total_amount) {
      const daysLeft = Math.floor(
        (new Date(booking.departure_date).getTime() - Date.now()) / 86400000
      );
      refundAmount =
        daysLeft > 30 ? booking.total_amount
        : daysLeft >= 7 ? booking.total_amount * 0.5
        : 0;
    }

    const { data: updated, error: updateError } = await supabase
      .from(TABLES.travelRequests)
      .update({ booking_status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, booking_reference, booking_status, cancelled_at')
      .single();

    if (updateError) throw new AppError(updateError.message, 500);

    // Audit log — real columns: customer_id, from_status, to_status, note
    await supabase.from(TABLES.portalStatusLog).insert({
      request_id: id,
      customer_id: booking.client_user_id ?? '',
      from_status: booking.booking_status ?? 'pending',
      to_status: 'cancelled',
      changed_by: user.id,
      note: reason,
    });

    // In-app notification
    if (booking.client_user_id) {
      void supabase.from(TABLES.portalNotifications).insert({
        customer_id: booking.client_user_id,
        title: '❌ تم إلغاء حجزك',
        body: `تم إلغاء حجزك ${booking.booking_reference ?? id}. ${reason}`.trim(),
        type: 'booking_cancelled',
        travel_request_id: id,
      });
    }

    return successResponse(
      {
        booking_id: updated.id,
        reference: updated.booking_reference,
        status: updated.booking_status,
        cancelled_at: updated.cancelled_at,
        refund_amount: refundAmount,
      },
      'تم إلغاء الحجز بنجاح'
    );
  } catch (err) {
    return errorResponse(err as Error);
  }
}
