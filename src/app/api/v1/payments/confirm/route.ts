import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { AppError } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);

    const body = await request.json();
    const { payment_id, notes } = body;

    if (!payment_id) throw new AppError('Payment ID is required', 400);

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from(TABLES.paymentRecords)
      .select('id, status, amount, booking_id')
      .eq('id', payment_id)
      .single();

    if (paymentError || !payment) return notFoundResponse('Payment');
    if (payment.status === 'paid') throw new AppError('Payment is already confirmed', 400);

    // Update payment status — use columns that actually exist in DB
    const { data: updated, error: updateError } = await supabase
      .from(TABLES.paymentRecords)
      .update({ status: 'paid' })
      .eq('id', payment_id)
      .select('id, status, amount')
      .single();

    if (updateError) throw new AppError(updateError.message, 500);

    // Update booking status if linked
    if (payment.booking_id) {
      const { data: bookings } = await supabase
        .from(TABLES.travelRequests)
        .select('id, client_user_id, booking_reference')
        .eq('id', payment.booking_id);

      const booking = bookings?.[0];
      if (booking) {
        await supabase
          .from(TABLES.travelRequests)
          .update({ booking_status: 'confirmed' })
          .eq('id', booking.id);

        // In-app notification
        if (booking.client_user_id) {
          void supabase.from(TABLES.portalNotifications).insert({
            customer_id: booking.client_user_id,
            title: '💰 تم تأكيد دفعتك',
            body: `تم تأكيد دفعتك لحجز ${booking.booking_reference ?? booking.id} بنجاح.`,
            type: 'payment_confirmed',
            travel_request_id: booking.id,
          });
        }
      }
    }

    return successResponse(
      { payment_id: updated.id, status: updated.status },
      'تم تأكيد الدفع بنجاح'
    );
  } catch (err) {
    return errorResponse(err as Error);
  }
}
