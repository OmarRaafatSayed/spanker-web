import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { AppError } from '@/lib/api/errors';

/**
 * GET /api/admin/bookings/[id]/notes
 * Internal notes are stored as customer_communications rows with
 * communication_type = 'internal_note'.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);
    const { id } = await params;

    const { data: booking } = await supabase
      .from(TABLES.travelRequests)
      .select('id')
      .eq('id', id)
      .single();
    if (!booking) return notFoundResponse('Booking');

    const { data: notes, error } = await supabase
      .from(TABLES.customerCommunications)
      .select(`
        id,
        message,
        communication_type,
        subject,
        staff_user_id,
        created_at
      `)
      .eq('travel_request_id', id)
      .eq('communication_type', 'internal_note')
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    return successResponse({ booking_id: id, notes: notes ?? [] });
  } catch (err) {
    return errorResponse(err as Error);
  }
}

/**
 * POST /api/admin/bookings/[id]/notes
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);
    const { id } = await params;

    const body = await request.json();
    const { note, is_important } = body;

    if (!note?.trim()) throw new AppError('Note content is required', 400);

    const { data: booking } = await supabase
      .from(TABLES.travelRequests)
      .select('id, client_user_id')
      .eq('id', id)
      .single();
    if (!booking) return notFoundResponse('Booking');

    const { data: newNote, error } = await supabase
      .from(TABLES.customerCommunications)
      .insert({
        travel_request_id: id,
        client_user_id: booking.client_user_id ?? '',
        staff_user_id: user.id,
        communication_type: 'internal_note',
        subject: is_important ? '⭐ ملاحظة مهمة' : 'ملاحظة',
        message: note.trim(),
      })
      .select('id, message, communication_type, subject, staff_user_id, created_at')
      .single();

    if (error) throw new AppError(error.message, 500);

    return successResponse(newNote, 'تمت إضافة الملاحظة بنجاح');
  } catch (err) {
    return errorResponse(err as Error);
  }
}
