/**
 * Portal Dashboard API Route
 * GET /api/v1/portal/dashboard
 * 
 * Returns aggregated dashboard statistics for authenticated users:
 * - Request counts (total, active, completed)
 * - Document counts by status
 * - Unread notification count
 * - Latest 5 travel requests
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { portalService } from '@/modules/portal/services/portalService';

/**
 * GET handler for dashboard statistics
 * @returns DashboardResponse with live Supabase data scoped to authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase server client (async - must await)
    const supabase = await createServerClient();

    // Authenticate user - throws 401 if unauthenticated
    const user = await requireUser(supabase);

    // Fetch dashboard data scoped to this user
    const data = await portalService.getDashboard(user.id);

    // Return successful response
    return successResponse(data);
  } catch (err) {
    // Handle errors using standard error response helper
    return errorResponse(err as Error);
  }
}
