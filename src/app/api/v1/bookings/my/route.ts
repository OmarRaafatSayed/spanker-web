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
    const status      = searchParams.get('status')      as BookingStatus | null;
    const vertical    = searchParams.get('vertical')    as BookingVertical | null;
    const dateFrom    = searchParams.get('date_from');
    const dateTo      = searchParams.get('date_to');
    const amountMin   = searchParams.get('amount_min');
    const amountMax   = searchParams.get('amount_max');
    const assignedTo  = searchParams.get('assigned_to');
    const search      = searchParams.get('search');
    const page        = parseInt(searchParams.get('page')  ?? '1', 10);
    const limit       = parseInt(searchParams.get('limit') ?? '10', 10);

    // Check if user is staff/admin (staff can view all bookings)
    const { data: profile } = await supabase
      .from(TABLES.profiles)
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isStaff = profile?.role === 'staff' || profile?.role === 'admin';

    // Build base query: travel_requests
    // If customer, only show their bookings; if staff, show all
    let query = supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact' });

    if (!isStaff) {
      query = query.eq('client_user_id', user.id);
    }

    // Apply filters at DB level before executing
    if (status) {
      query = query.eq('booking_status', status);
    }
    if (vertical) {
      query = query.eq('vertical', vertical);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      // Add one day to include the entire end date
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt('created_at', endDate.toISOString());
    }
    if (amountMin) {
      query = query.gte('total_amount', parseFloat(amountMin));
    }
    if (amountMax) {
      query = query.lte('total_amount', parseFloat(amountMax));
    }
    if (assignedTo) {
      if (assignedTo === '_unassigned') {
        query = query.is('assigned_staff_id', null);
      } else {
        query = query.eq('assigned_staff_id', assignedTo);
      }
    }
    if (search) {
      query = query.ilike('booking_reference', `%${search}%`);
    }

    // Order by created_at descending
    query = query.order('created_at', { ascending: false });

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
