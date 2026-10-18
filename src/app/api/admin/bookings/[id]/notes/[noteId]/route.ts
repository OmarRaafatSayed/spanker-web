import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { AppError } from '@/lib/api/errors';

/** DELETE /api/admin/bookings/[id]/notes/[noteId] */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);
    const { noteId } = await params;

    const { data: staffProfile } = await supabase
      .from(TABLES.profiles)
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    const { data: note, error: fetchError } = await supabase
      .from(TABLES.customerCommunications)
      .select('id, staff_user_id')
      .eq('id', noteId)
      .single();

    if (fetchError || !note) return notFoundResponse('Note');

    const isCreator = note.staff_user_id === user.id;
    const isAdmin = staffProfile?.role === 'admin';

    if (!isCreator && !isAdmin) throw new AppError('You can only delete your own notes', 403);

    const { error } = await supabase
      .from(TABLES.customerCommunications)
      .delete()
      .eq('id', noteId);

    if (error) throw new AppError(error.message, 500);

    return successResponse(null, 'تم حذف الملاحظة بنجاح');
  } catch (err) {
    return errorResponse(err as Error);
  }
}

/** PATCH /api/admin/bookings/[id]/notes/[noteId] */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);
    const { noteId } = await params;

    const body = await request.json();
    const { note, is_important } = body;
    if (!note?.trim()) throw new AppError('Note content is required', 400);

    const { data: existingNote, error: fetchError } = await supabase
      .from(TABLES.customerCommunications)
      .select('id, staff_user_id')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) return notFoundResponse('Note');

    if (existingNote.staff_user_id !== user.id)
      throw new AppError('You can only edit your own notes', 403);

    const { data: updated, error } = await supabase
      .from(TABLES.customerCommunications)
      .update({
        message: note.trim(),
        subject: is_important ? '⭐ ملاحظة مهمة' : 'ملاحظة',
      })
      .eq('id', noteId)
      .select('id, message, communication_type, subject, staff_user_id, created_at')
      .single();

    if (error) throw new AppError(error.message, 500);

    return successResponse(updated, 'تم تحديث الملاحظة بنجاح');
  } catch (err) {
    return errorResponse(err as Error);
  }
}
