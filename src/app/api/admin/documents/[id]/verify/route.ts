import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import { AppError } from '@/lib/api/errors';

/**
 * POST /api/admin/documents/[id]/verify
 * Real column names: status (not verification_status), reviewed_by, reviewed_at, rejection_reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);

    const { id } = await params;
    const body = await request.json();
    const { action, rejection_reason } = body;

    if (!['approve', 'reject'].includes(action)) {
      throw new AppError('Invalid action. Must be "approve" or "reject"', 400);
    }
    if (action === 'reject' && !rejection_reason) {
      throw new AppError('rejection_reason is required when rejecting', 400);
    }

    // Fetch document with real columns only
    const { data: doc, error: fetchErr } = await supabase
      .from(TABLES.customerDocuments)
      .select('id, status, document_type, client_user_id, travel_request_id')
      .eq('id', id)
      .single();

    if (fetchErr || !doc) return notFoundResponse('Document');
    if (doc.status === 'verified') throw new AppError('Document is already verified', 400);

    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    const { data: updated, error: updateErr } = await supabase
      .from(TABLES.customerDocuments)
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: action === 'reject' ? rejection_reason : null,
      })
      .eq('id', id)
      .select('id, status, reviewed_at')
      .single();

    if (updateErr) throw new AppError(updateErr.message, 500);

    // Notify customer via in-app notification
    if (doc.client_user_id) {
      await supabase.from(TABLES.portalNotifications).insert({
        customer_id: doc.client_user_id,
        title: action === 'approve' ? '✅ تمت الموافقة على مستندك' : '❌ تم رفض مستندك',
        body: action === 'approve'
          ? `تمت الموافقة على مستند ${doc.document_type} الخاص بك.`
          : `تم رفض مستند ${doc.document_type}. السبب: ${rejection_reason}`,
        type: action === 'approve' ? 'document_approved' : 'document_rejected',
        travel_request_id: doc.travel_request_id,
      });
    }

    return successResponse(
      { document_id: updated.id, status: updated.status, reviewed_at: updated.reviewed_at },
      action === 'approve' ? 'تمت الموافقة على المستند' : 'تم رفض المستند'
    );
  } catch (err) {
    return errorResponse(err as Error);
  }
}
