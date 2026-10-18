import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import { z } from 'zod';

const bulkActionSchema = z.object({
  booking_ids: z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(['confirm', 'cancel', 'assign']),
  assign_to: z.string().uuid().optional(),
  cancel_reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const staff = await requireStaff(supabase);

    const body = await request.json();
    const validation = bulkActionSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse('Invalid request data');
    }

    const { booking_ids, action, assign_to, cancel_reason } = validation.data;

    // Verify all bookings exist — use columns that actually exist in the DB schema
    const { data: bookings, error: fetchError } = await supabase
      .from(TABLES.travelRequests)
      .select('id, booking_status, client_user_id, vertical, booking_reference')
      .in('id', booking_ids);

    if (fetchError) throw new AppError(fetchError.message, 500);
    if (!bookings || bookings.length !== booking_ids.length) {
      return validationErrorResponse('Some bookings not found');
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[],
    };

    // Get the staff's profile id (needed as customer_id for status log)
    const { data: staffProfile } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', staff.id)
      .single();

    const staffProfileId = staffProfile?.id ?? staff.id;

    for (const booking of bookings) {
      try {
        switch (action) {
          case 'confirm':
            await confirmBooking(supabase, booking, staffProfileId);
            results.success.push(booking.id);
            break;
          case 'cancel':
            await cancelBooking(supabase, booking, staffProfileId, cancel_reason);
            results.success.push(booking.id);
            break;
          case 'assign':
            if (!assign_to) {
              results.failed.push({ id: booking.id, reason: 'Missing assign_to' });
              continue;
            }
            await assignBooking(supabase, booking, assign_to, staffProfileId);
            results.success.push(booking.id);
            break;
        }
      } catch (err) {
        results.failed.push({ id: booking.id, reason: (err as Error).message });
      }
    }

    return successResponse({
      action,
      total: booking_ids.length,
      success: results.success.length,
      failed: results.failed.length,
      results,
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}

async function confirmBooking(supabase: any, booking: any, staffProfileId: string) {
  if (booking.booking_status === 'confirmed') throw new Error('Already confirmed');
  if (booking.booking_status === 'cancelled') throw new Error('Cannot confirm cancelled booking');

  const { error } = await supabase
    .from(TABLES.travelRequests)
    .update({ booking_status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', booking.id);
  if (error) throw new AppError(error.message, 500);

  await supabase.from(TABLES.portalStatusLog).insert({
    request_id: booking.id,
    customer_id: booking.client_user_id ?? staffProfileId,
    from_status: booking.booking_status,
    to_status: 'confirmed',
    changed_by: staffProfileId,
    note: 'Bulk confirmation',
  });

  // Fire-and-forget in-app notification
  supabase.from(TABLES.portalNotifications).insert({
    customer_id: booking.client_user_id,
    title: 'تم تأكيد حجزك',
    body: `تم تأكيد حجزك ${booking.booking_reference ?? ''} بنجاح.`,
    type: 'booking_confirmed',
    travel_request_id: booking.id,
  }).then(() => {}).catch(console.error);
}

async function cancelBooking(
  supabase: any,
  booking: any,
  staffProfileId: string,
  reason?: string
) {
  if (booking.booking_status === 'cancelled') throw new Error('Already cancelled');

  const { error } = await supabase
    .from(TABLES.travelRequests)
    .update({ booking_status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', booking.id);
  if (error) throw new AppError(error.message, 500);

  await supabase.from(TABLES.portalStatusLog).insert({
    request_id: booking.id,
    customer_id: booking.client_user_id ?? staffProfileId,
    from_status: booking.booking_status,
    to_status: 'cancelled',
    changed_by: staffProfileId,
    note: reason ?? 'Bulk cancellation',
  });

  supabase.from(TABLES.portalNotifications).insert({
    customer_id: booking.client_user_id,
    title: 'تم إلغاء حجزك',
    body: `تم إلغاء حجزك ${booking.booking_reference ?? ''}. ${reason ?? ''}`.trim(),
    type: 'booking_cancelled',
    travel_request_id: booking.id,
  }).then(() => {}).catch(console.error);
}

async function assignBooking(
  supabase: any,
  booking: any,
  assignTo: string,
  staffProfileId: string
) {
  const { data: assignee, error: assigneeError } = await supabase
    .from(TABLES.profiles)
    .select('id, role')
    .eq('id', assignTo)
    .single();

  if (assigneeError || !assignee) throw new Error('Invalid assignee');
  if (!['staff', 'admin'].includes(assignee.role)) throw new Error('Can only assign to staff members');

  const { error } = await supabase
    .from(TABLES.travelRequests)
    .update({ assigned_staff_id: assignTo, updated_at: new Date().toISOString() })
    .eq('id', booking.id);
  if (error) throw new AppError(error.message, 500);

  await supabase.from(TABLES.portalStatusLog).insert({
    request_id: booking.id,
    customer_id: booking.client_user_id ?? staffProfileId,
    from_status: booking.booking_status,
    to_status: booking.booking_status,
    changed_by: staffProfileId,
    note: `Assigned to staff ${assignTo}`,
  });
}
