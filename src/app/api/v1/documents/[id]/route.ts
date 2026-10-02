import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  noContentResponse,
  errorResponse,
  notFoundResponse,
} from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';

/**
 * DELETE /api/v1/documents/[id]
 * 
 * Deletes a document from both Supabase Storage and the database.
 * 
 * Requirements: 4.4
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Fetch document from DB (verify ownership via client_user_id)
 * 3. Extract storage path from file_path
 * 4. Delete from Supabase Storage
 * 5. Delete from customer_documents table
 * 6. Return 204 No Content
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // Await params (Next.js 15 requirement)
    const { id } = await params;

    // 2. Fetch document and verify ownership
    const { data: doc, error: fetchError } = await supabase
      .from(TABLES.customerDocuments)
      .select('id, file_path, client_user_id')
      .eq('id', id)
      .eq('client_user_id', user.id)
      .single();

    if (fetchError || !doc) {
      return notFoundResponse('Document');
    }

    // 3. Extract storage path from file_path
    // file_path format: https://<project>.supabase.co/storage/v1/object/public/customer-documents/<path>
    // We need: <path> portion after 'customer-documents/'
    let storagePath = '';
    if (doc.file_path) {
      const match = doc.file_path.match(/customer-documents\/(.+)$/);
      if (match) {
        storagePath = match[1];
      }
    }

    // 4. Delete from Supabase Storage (non-blocking — log errors but continue)
    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('customer-documents')
        .remove([storagePath]);

      if (storageError) {
        console.error('Storage deletion failed (non-fatal):', {
          documentId: id,
          storagePath,
          error: storageError,
        });
      }
    }

    // 5. Delete from customer_documents table
    const { error: deleteError } = await supabase
      .from(TABLES.customerDocuments)
      .delete()
      .eq('id', id);

    if (deleteError) {
      return errorResponse(deleteError as Error);
    }

    // 6. Return 204 No Content
    return noContentResponse();
  } catch (err) {
    return errorResponse(err as Error);
  }
}
