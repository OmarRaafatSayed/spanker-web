import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import { z } from 'zod';

const assignSchema = z.object({
  assigned_to: z.string().uuid().nullable(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const staff = await requireStaff(supabase);
    const bookingId = params.id;

    const body = await request.json();
    const validation = assignSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse('Invalid request data');
    }

    const { assigned_to, notes } = validation.data;

    // Verify booking exists
    const { data: booking, error: fetchError } = await supabase
      .from(TABLES.travelRequests)
      .select('id, booking_reference, booking_status, assigned_staff_id, client_user_id')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) return notFoundResponse('Booking');

    // Validate assignee if provided
    if (assigned_to) {
      const { data: assignee, error: ae } = await supabase
        .from(TABLES.profiles)
        .select('id, role')
        .eq('id', assigned_to)
        .single();
      if (ae || !assignee) return validationErrorResponse('Invalid staff member');
      if (!['staff', 'admin'].includes(assignee.role))
        return validationErrorResponse('Can only assign to staff members');
    }

    // Get staff profile id for audit log
    const { data: staffProfile } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', staff.id)
      .single();
    const staffProfileId = staffProfile?.id ?? staff.id;

    // Update booking — use real column name
    const { error: updateError } = await supabase
      .from(TABLES.travelRequests)
      .update({ assigned_staff_id: assigned_to, updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (updateError) throw new AppError(updateError.message, 500);

    // Audit log
    await supabase.from(TABLES.portalStatusLog).insert({
      request_id: bookingId,
      customer_id: booking.client_user_id ?? staffProfileId,
      from_status: booking.booking_status ?? 'unknown',
      to_status: booking.booking_status ?? 'unknown',
      changed_by: staffProfileId,
      note: assigned_to
        ? `Assigned to ${assigned_to}${notes ? ': ' + notes : ''}`
        : 'Unassigned',
    });

    // Notify new assignee (fire-and-forget)
    if (assigned_to && assigned_to !== booking.assigned_staff_id) {
      void supabase.from(TABLES.portalNotifications).insert({
        customer_id: assigned_to,
        title: 'تم تعيين حجز جديد لك',
        body: `تم تعيينك على الحجز ${booking.booking_reference ?? bookingId}`,
        type: 'booking_assigned',
        travel_request_id: bookingId,
      });
    }

    return successResponse({
      booking_id: bookingId,
      assigned_to,
      message: assigned_to ? 'Booking assigned successfully' : 'Booking unassigned',
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
