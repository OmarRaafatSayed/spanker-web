import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import type { BookingDetails, BookingListParams, BookingStatus, BookingVertical } from '@/types/api';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    const { searchParams } = new URL(request.url);

    const params: BookingListParams = {
      status: (searchParams.get('status') as BookingStatus) || undefined,
      vertical: (searchParams.get('vertical') as BookingVertical) || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    };

    const validStatuses = ['draft', 'pending', 'confirmed', 'cancelled', 'expired', 'refunded', 'completed'];
    if (params.status && !validStatuses.includes(params.status)) {
      return validationErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const validVerticals = ['flight', 'hotel', 'visa', 'trip'];
    if (params.vertical && !validVerticals.includes(params.vertical)) {
      return validationErrorResponse(`Invalid vertical. Must be one of: ${validVerticals.join(', ')}`);
    }

    if (params.page && params.page < 1) return validationErrorResponse('Page must be >= 1');
    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      return validationErrorResponse('Limit must be between 1 and 100');
    }

    let query = supabase
      .from(TABLES.travelRequests)
      .select('*', { count: 'exact' })
      .eq('client_user_id', user.id)
      .order('created_at', { ascending: false });

    if (params.status) query = query.eq('booking_status', params.status);
    if (params.vertical) query = query.eq('vertical', params.vertical);
    if (params.from_date) query = query.gte('created_at', params.from_date);
    if (params.to_date) query = query.lte('created_at', params.to_date);

    const from = (params.page! - 1) * params.limit!;
    query = query.range(from, from + params.limit! - 1);

    const { data: bookings, error, count } = await query;
    if (error) throw new AppError(`Failed to fetch bookings: ${error.message}`, 500);

    return successResponse(
      (bookings ?? []) as unknown as BookingDetails[],
      undefined,
      {
        page: params.page!,
        limit: params.limit!,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / params.limit!),
      }
    );
  } catch (error) {
    return errorResponse(error as Error);
  }
}
