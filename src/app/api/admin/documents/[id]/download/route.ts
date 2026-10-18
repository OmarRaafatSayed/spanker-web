import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { errorResponse, notFoundResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

/**
 * GET /api/admin/documents/[id]/download
 * Real column: file_path (used as storage path)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);

    const { id } = await params;

    const { data: doc, error } = await supabase
      .from(TABLES.customerDocuments)
      .select('id, file_path, file_name')
      .eq('id', id)
      .single();

    if (error || !doc) return notFoundResponse('Document');
    if (!doc.file_path) return notFoundResponse('Document file');

    const { data: signedUrl, error: urlErr } = await supabase.storage
      .from('customer-documents')
      .createSignedUrl(doc.file_path, 3600);

    if (urlErr || !signedUrl) {
      throw new AppError('Failed to generate download URL', 500);
    }

    return Response.redirect(signedUrl.signedUrl);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
