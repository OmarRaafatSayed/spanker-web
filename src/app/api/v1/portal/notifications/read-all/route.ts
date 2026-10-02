import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { noContentResponse, errorResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { portalService } from '@/modules/portal/services/portalService';

/**
 * POST /api/v1/portal/notifications/read-all
 * Mark all notifications as read for the authenticated user
 *
 * Requirements: 3.4, 7.1, 7.4
 * Bug_Condition: Route at `/api/v1/portal/notifications/read-all` does not exist — any request returns 404
 * Expected_Behavior: Route authenticates the caller and bulk-updates all unread notifications to read for that user
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client (async - must await)
    const supabase = await createServerClient();

    // Authenticate user - throws 401 if unauthenticated
    const user = await requireUser(supabase);

    // Get profile.id for the authenticated user
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return errorResponse(
        new Error('Failed to fetch user profile'),
        500
      );
    }

    // Call portalService to mark all notifications as read
    await portalService.markAllNotificationsRead(profile.id);

    // Return HTTP 204 No Content (standard for successful bulk update with no response body)
    return noContentResponse();
  } catch (err) {
    // Handle all errors
    return errorResponse(err as Error);
  }
}
