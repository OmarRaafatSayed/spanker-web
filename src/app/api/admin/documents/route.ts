import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

/**
 * GET /api/admin/documents
 * Real column names: status (not verification_status), file_path (not storage_path)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from(TABLES.customerDocuments)
      .select(
        `id, document_type, file_name, file_path, status, rejection_reason,
         reviewed_at, reviewed_by, created_at, updated_at,
         client_user_id, travel_request_id`,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('document_type', type);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError(error.message, 500);

    return successResponse({
      documents: data ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
