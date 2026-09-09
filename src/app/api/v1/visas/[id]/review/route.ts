/**
 * POST /api/v1/visas/:id/review
 * 
 * Review a visa application (staff only - reviewer role)
 * Approve, reject, or request more information
 */

import { NextRequest } from 'next/server';
import {
  createSupabaseServerClient,
  requireStaff,
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  handleRPCError,
  ValidationError,
} from '@/lib/api';
import type { ReviewVisaApplicationRequest, ReviewVisaApplicationResponse } from '@/types/api';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/v1/visas/:id/review
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visaBookingDetailId = params.id;

    if (!visaBookingDetailId) {
      throw new ValidationError('Visa booking detail ID is required');
    }

    // 1. Require staff access with reviewer role
    const staff = await requireStaff(['admin', 'reviewer']);

    const supabase = createSupabaseServerClient();

    // 2. Parse request body
    const body = (await request.json()) as Omit<
      ReviewVisaApplicationRequest,
      'visa_booking_detail_id'
    >;

    if (!body.decision) {
      return validationErrorResponse('decision is required');
    }

    // Validate decision
    const validDecisions = ['approve', 'reject', 'needs_more_info'];
    if (!validDecisions.includes(body.decision)) {
      return validationErrorResponse(
        `decision must be one of: ${validDecisions.join(', ')}`
      );
    }

    // Validate required_documents for 'needs_more_info'
    if (
      body.decision === 'needs_more_info' &&
      (!body.required_documents || body.required_documents.length === 0)
    ) {
      return validationErrorResponse(
        'required_documents is required when decision is "needs_more_info"'
      );
    }

    // 3. Check if visa booking detail exists
    const { data: visaBookingDetail, error: fetchError } = await supabase
      .from('visa_booking_details')
      .select('id, booking_id, review_status')
      .eq('id', visaBookingDetailId)
      .maybeSingle();

    if (fetchError) {
      console.error('[POST /api/v1/visas/:id/review] Fetch error:', fetchError);
      throw new Error(`Failed to fetch visa application: ${fetchError.message}`);
    }

    if (!visaBookingDetail) {
      return notFoundResponse('Visa application');
    }

    // 4. Validate review status
    if (visaBookingDetail.review_status === 'approved') {
      throw new ValidationError('Application is already approved');
    }

    if (visaBookingDetail.review_status === 'rejected') {
      throw new ValidationError('Application is already rejected');
    }

    if (visaBookingDetail.review_status === 'pending') {
      throw new ValidationError('Application has not been submitted yet');
    }

    // 5. Call review_visa_application RPC function
    const { data: result, error: rpcError } = await supabase.rpc(
      'review_visa_application',
      {
        p_visa_booking_detail_id: visaBookingDetailId,
        p_decision: body.decision,
        p_notes: body.notes || null,
        p_required_documents:
          body.decision === 'needs_more_info' ? body.required_documents : null,
      }
    );

    if (rpcError) {
      console.error('[POST /api/v1/visas/:id/review] RPC error:', rpcError);
      throw new Error(`Review failed: ${rpcError.message}`);
    }

    // 6. Check RPC function response
    if (!result.ok) {
      handleRPCError(result);
    }

    // Map decision to review_status
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      needs_more_info: 'needs_more_info',
    };

    const response: ReviewVisaApplicationResponse = {
      visa_booking_detail_id: visaBookingDetailId,
      review_status: statusMap[body.decision] as any,
      reviewed_at: new Date().toISOString(),
      reviewed_by: staff.id,
      notes: body.notes,
    };

    return successResponse(response, 'Visa application reviewed successfully');
  } catch (error) {
    console.error('[POST /api/v1/visas/:id/review] Error:', error);
    return errorResponse(error as Error);
  }
}
