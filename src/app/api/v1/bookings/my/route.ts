import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import type { BookingStatus, BookingVertical } from '@/types/api';

/**
 * GET /api/v1/bookings/my
 * 
 * Fetches authenticated user's bookings from travel_requests table.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 * 
 * Bug_Condition: route returns MOCK_MY_BOOKINGS to all callers with no auth check
 * Expected_Behavior: unauthenticated callers receive 401; authenticated callers 
 * receive only their own bookings
 * 
 * Preservation: response shape { success: true, data, meta: { page, limit, total, total_pages } } unchanged
 */
export async function GET(request: NextRequest) {
  try {
    // Auth guard → throws 401 for unauthenticated callers
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status   = searchParams.get('status')   as BookingStatus | null;
    const vertical = searchParams.get('vertical') as BookingVertical | null;
    const page     = parseInt(searchParams.get('page')  ?? '1', 10);
    const limit    = parseInt(searchParams.get('limit') ?? '10', 10);

    // Build base query: travel_requests where client_user_id = user.id
    let query = supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact' })
      .eq('client_user_id', user.id);

    // Apply filters at DB level before executing
    if (status) {
      query = query.eq('booking_status', status);
    }
    if (vertical) {
      query = query.eq('vertical', vertical);
    }

    // Apply pagination range
    query = query.range((page - 1) * limit, page * limit - 1);

    // Execute query (count comes from the same query)
    const { data, error, count: total } = await query;

    if (error) {
      return errorResponse(error as Error);
    }

    // Return with pagination meta
    return successResponse(data || [], undefined, {
      page,
      limit,
      total: total ?? 0,
      total_pages: Math.ceil((total ?? 0) / limit),
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
