import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { handleRPCError, ValidationError, AppError } from '@/lib/api/errors';
import type { ReviewVisaApplicationRequest, ReviewVisaApplicationResponse } from '@/types/api';
import type { Json } from '@/types/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const visaBookingDetailId = params.id;
    if (!visaBookingDetailId) throw new ValidationError('Visa booking detail ID is required');

    const staff = await requireStaff(['admin', 'reviewer']);
    const supabase = await createServerClient();

    const body = (await request.json()) as Omit<ReviewVisaApplicationRequest, 'visa_booking_detail_id'>;

    if (!body.decision) return validationErrorResponse('decision is required');

    const validDecisions = ['approve', 'reject', 'needs_more_info'];
    if (!validDecisions.includes(body.decision)) {
      return validationErrorResponse(`decision must be one of: ${validDecisions.join(', ')}`);
    }
    if (body.decision === 'needs_more_info' && (!body.required_documents || body.required_documents.length === 0)) {
      return validationErrorResponse('required_documents is required when decision is "needs_more_info"');
    }

    const { data: visaBookingDetail, error: fetchError } = await supabase
      .from('visa_booking_details')
      .select('id, travel_request_id')
      .eq('id', visaBookingDetailId)
      .maybeSingle();

    if (fetchError) throw new AppError(`Failed to fetch visa application: ${fetchError.message}`, 500);
    if (!visaBookingDetail) return notFoundResponse('Visa application');

    const { data: result, error: rpcError } = await supabase.rpc('review_visa_application', {
      p_visa_booking_detail_id: visaBookingDetailId,
      p_decision: body.decision,
      p_notes: body.notes ?? undefined,
      p_required_documents: body.decision === 'needs_more_info'
        ? (body.required_documents as unknown as Json)
        : undefined,
    });

    if (rpcError) throw new AppError(`Review failed: ${rpcError.message}`, 500);

    const rpcResult = result as { ok: boolean; code?: string; message?: string; data?: Json };
    if (!rpcResult?.ok) handleRPCError(rpcResult);

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      needs_more_info: 'needs_more_info',
    };

    const response: ReviewVisaApplicationResponse = {
      visa_booking_detail_id: visaBookingDetailId,
      review_status: statusMap[body.decision] as ReviewVisaApplicationResponse['review_status'],
      reviewed_at: new Date().toISOString(),
      reviewed_by: staff.id,
      notes: body.notes,
    };

    return successResponse(response, 'Visa application reviewed successfully');
  } catch (error) {
    return errorResponse(error as Error);
  }
}
