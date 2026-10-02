import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { portalService } from '@/modules/portal/services/portalService';

/**
 * GET /api/v1/portal/notifications
 * Get notifications for the authenticated user
 * Query params:
 *   - unread_only: 'true' to filter only unread notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // Get profile.id from user_id (needed for notifications query)
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse(new Error('Profile not found'));
    }

    // Read unread_only query parameter
    const unreadOnly = request.nextUrl.searchParams.get('unread_only') === 'true';

    // Call service layer to get notifications
    const data = await portalService.getNotifications(profile.id, unreadOnly);

    return successResponse(data, undefined, { profile_id: profile.id });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
