import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    const body = await request.json();
    const { notification_id, mark_all } = body;

    // portal_notifications.customer_id = profiles.id
    const { data: profile } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', user.id)
      .single();

    const customerId = profile?.id ?? user.id;

    if (mark_all) {
      const { error } = await supabase
        .from(TABLES.portalNotifications)
        .update({ is_read: true })
        .eq('customer_id', customerId)
        .eq('is_read', false);

      if (error) throw new AppError(error.message, 500);
      return successResponse(null, 'تم وضع علامة مقروء على جميع الإشعارات');
    }

    if (!notification_id) throw new AppError('notification_id or mark_all is required', 400);

    const { error } = await supabase
      .from(TABLES.portalNotifications)
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('customer_id', customerId);

    if (error) throw new AppError(error.message, 500);
    return successResponse(null, 'تم وضع علامة مقروء');
  } catch (err) {
    return errorResponse(err as Error);
  }
}
