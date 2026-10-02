import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  createdResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { TABLES } from '@/lib/db/schema';
import type { DocumentResponse } from '@/modules/portal/types/portal.types';

/**
 * POST /api/v1/documents/upload
 * 
 * Handles multipart/form-data document uploads to Supabase Storage.
 * 
 * Requirements: 4.1, 4.2, 4.3
 * 
 * Flow:
 * 1. Authenticate user
 * 2. Parse and validate form data (file, request_id, doc_type)
 * 3. Upload to Supabase Storage (customer-documents bucket)
 * 4. Get public URL from storage
 * 5. Insert metadata into customer_documents table
 * 6. Map DB fields to API response format
 * 7. Return created document record
 * 
 * Bug_Condition: `useDocuments.uploadDocument` uses `URL.createObjectURL` 
 * — blob URL expires on page reload; no Storage write occurs; no DB row is inserted
 * 
 * Expected_Behavior: file is persisted in Supabase Storage; a permanent public 
 * URL is stored in `customer_documents`
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // 2. Parse and validate form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestId = formData.get('request_id') as string | null;
    const docType = formData.get('doc_type') as string | null;

    // Validate required fields (do NOT touch storage if validation fails)
    if (!file) {
      return validationErrorResponse('Missing required field: file');
    }
    if (!requestId) {
      return validationErrorResponse('Missing required field: request_id');
    }
    if (!docType) {
      return validationErrorResponse('Missing required field: doc_type');
    }

    // 3. Build storage path and upload to Supabase Storage
    const storagePath = `${user.id}/${requestId}/${file.name}`;

    const { error: storageError } = await supabase.storage
      .from('customer-documents')
      .upload(storagePath, file);

    // If storage upload fails, return error WITHOUT inserting DB row
    if (storageError) {
      return errorResponse(storageError as Error);
    }

    // 4. Get permanent public URL from Supabase Storage
    const { data: publicUrlData } = supabase.storage
      .from('customer-documents')
      .getPublicUrl(storagePath);

    // 5. Insert metadata into customer_documents table
    // Note: DB schema uses travel_request_id, client_user_id, document_type, file_path
    const { data: insertedDoc, error: insertError } = await supabase
      .from(TABLES.customerDocuments)
      .insert({
        travel_request_id: requestId,
        client_user_id: user.id,
        document_type: docType,
        file_path: publicUrlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        status: 'uploaded',
      })
      .select()
      .single();

    if (insertError || !insertedDoc) {
      // Storage file was uploaded but DB insert failed — log for cleanup
      console.error('Document metadata insert failed after storage upload:', {
        storagePath,
        error: insertError,
      });
      return errorResponse(
        new Error('Failed to save document metadata. Please try again.')
      );
    }

    // 6. Map DB fields to API response format (portal types)
    const documentResponse: DocumentResponse = {
      id: insertedDoc.id,
      customer_id: insertedDoc.client_user_id,
      request_id: insertedDoc.travel_request_id,
      doc_type: insertedDoc.document_type as DocumentResponse['doc_type'],
      file_url: insertedDoc.file_path || '',
      file_name: insertedDoc.file_name || '',
      file_size: insertedDoc.file_size || undefined,
      mime_type: insertedDoc.mime_type || undefined,
      status: insertedDoc.status as DocumentResponse['status'],
      created_at: insertedDoc.created_at || new Date().toISOString(),
    };

    // 7. Return created document record
    return createdResponse<DocumentResponse>(documentResponse);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
