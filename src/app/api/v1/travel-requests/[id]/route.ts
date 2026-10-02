/**
 * Individual Travel Request API Route
 * GET /api/v1/travel-requests/[id] - Get single request with details
 * PUT /api/v1/travel-requests/[id] - Update pending request
 * 
 * Handles individual travel request operations scoped to authenticated users.
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { ConflictError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import { portalService } from '@/modules/portal/services/portalService';

/**
 * GET handler - Fetch single travel request by ID
 * Returns request with joined status_log and documents
 * Scoped to authenticated user (404 if not owned by requester)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase server client (async - must await)
    const supabase = await createServerClient();

    // Authenticate user - throws 401 if unauthenticated
    const user = await requireUser(supabase);

    // Fetch request with ownership verification
    const data = await portalService.getRequestById(params.id, user.id);

    // Return 404 if not found (never leaks existence to wrong user)
    if (!data) {
      return notFoundResponse('Travel request');
    }

    return successResponse(data);
  } catch (err) {
    return errorResponse(err as Error);
  }
}

/**
 * PUT handler - Update travel request
 * Only allows updates to pending requests
 * Returns 409 for non-pending requests, 404 if not found/not owned
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase server client (async - must await)
    const supabase = await createServerClient();

    // Authenticate user - throws 401 if unauthenticated
    const user = await requireUser(supabase);

    // Parse request body
    const body = await request.json();

    // Fetch existing request with ownership verification
    const existingRequest = await portalService.getRequestById(
      params.id,
      user.id
    );

    // Return 404 if not found for this user
    if (!existingRequest) {
      return notFoundResponse('Travel request');
    }

    // Check if request is still pending
    if (existingRequest.booking_status !== 'pending') {
      throw new ConflictError('Cannot update non-pending request');
    }

    // Update the request in database
    const { data, error } = await supabase
      .from(TABLES.travelRequests)
      .update({
        ...body,
        updated_at: new Date().toISOString(), // Track update time
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update request: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update request: No data returned');
    }

    return successResponse(data);
  } catch (err) {
    // ConflictError will be handled by errorResponse with status 409
    return errorResponse(err as Error);
  }
}
