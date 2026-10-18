import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') ?? '20');

    // portal_notifications.customer_id = profiles.id (not auth.users.id)
    const { data: profile } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', user.id)
      .single();

    const customerId = profile?.id ?? user.id;

    let query = supabase
      .from(TABLES.portalNotifications)
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) query = query.eq('is_read', false);

    const { data, error } = await query;
    if (error) throw new AppError(error.message, 500);

    const { count: unreadCount } = await supabase
      .from(TABLES.portalNotifications)
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId)
      .eq('is_read', false);

    return successResponse({
      notifications: data ?? [],
      unread_count: unreadCount ?? 0,
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
