import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  createdResponse,
} from '@/lib/api/response';
import { portalService } from '@/modules/portal/services/portalService';
import type { RequestStatus } from '@/modules/portal/types/portal.types';

/**
 * GET /api/v1/travel-requests
 * Fetch paginated list of travel requests for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    // Validate status parameter if provided
    if (status) {
      const validStatuses: RequestStatus[] = [
        'new',
        'in_review',
        'quoted',
        'booked',
        'completed',
        'cancelled',
      ];
      if (!validStatuses.includes(status as RequestStatus)) {
        return validationErrorResponse(
          `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
        );
      }
    }

    // Fetch requests via portal service
    const { data, total } = await portalService.getRequests(user.id, {
      status,
      page,
      limit,
    });

    // Calculate total pages
    const total_pages = Math.ceil(total / limit);

    // Return with pagination metadata
    return successResponse(data, undefined, {
      page,
      limit,
      total,
      total_pages,
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}

/**
 * POST /api/v1/travel-requests
 * Create a new travel request for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.full_name || !body.request_type || !body.destination) {
      return validationErrorResponse(
        'Missing required fields: full_name, request_type, destination'
      );
    }

    // Create request via portal service
    const record = await portalService.createRequest(user.id, body);

    return createdResponse(record);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
