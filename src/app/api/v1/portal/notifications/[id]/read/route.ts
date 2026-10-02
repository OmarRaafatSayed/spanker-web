import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { portalService } from '@/modules/portal/services/portalService';
import { NotFoundError } from '@/lib/api/errors';

/**
 * PATCH /api/v1/portal/notifications/[id]/read
 * Mark a notification as read
 *
 * Requirements: 3.3, 7.1, 7.4
 * Bug_Condition: Route at `/api/v1/portal/notifications/[id]/read` does not exist — any request returns 404
 * Expected_Behavior: Route authenticates the caller, marks the notification as read if it belongs to the user, returns 404 if not found or wrong owner
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Call portalService to mark notification as read
    // This enforces ownership - will throw NotFoundError if notification
    // doesn't exist or doesn't belong to the user
    await portalService.markNotificationRead(params.id, profile.id);

    // Return success
    return successResponse({ success: true });
  } catch (err) {
    // Handle NotFoundError specifically
    if (err instanceof NotFoundError) {
      return notFoundResponse('Notification');
    }

    // Handle all other errors
    return errorResponse(err as Error);
  }
}
