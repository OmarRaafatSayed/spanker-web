/**
 * document-upload-service.ts
 * ==========================
 * Module: /src/modules/visa
 *
 * Decoupled document upload flow.
 *
 * CRITICAL DESIGN:
 *   Upload to Supabase Storage → success locally → THEN fire CRM notification
 *   asynchronously. If the CRM notification fails, it is retried 3x and logged
 *   to system_logs. THE USER NEVER SEES A CRM FAILURE — only Supabase errors
 *   are surfaced as user-facing errors.
 *
 * FLOW:
 *   1. Upload file to Supabase Storage (customer-documents bucket)
 *   2. Insert row in customer_documents table
 *   3. Call update_document_completion() RPC
 *   4. Fire-and-forget: crmAdapter.notifyCrmDocumentUploaded()
 *   5. Return success to the UI regardless of step 4
 */

import { supabase } from "@/lib/supabase";
import { crmAdapter } from "@/lib/services/crm-adapter";
import type { CustomerDocument } from "@/types";

export interface UploadDocumentParams {
  requestId: string;
  clientUserId: string;
  documentType: string;
  file: File;
}

export type UploadResult =
  | { ok: true; document: CustomerDocument }
  | { ok: false; error: string };

/**
 * Upload a customer document.
 * CRM notification is async/fire-and-forget — never blocks the user.
 */
export async function uploadDocument(params: UploadDocumentParams): Promise<UploadResult> {
  const { requestId, clientUserId, documentType, file } = params;

  // ── 1. Build storage path ──────────────────────────────────────────────────
  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}_${documentType}.${ext}`;
  const filePath = `documents/${clientUserId}/${requestId}/${fileName}`;

  // ── 2. Upload to Supabase Storage ──────────────────────────────────────────
  const { error: uploadError } = await supabase.storage
    .from("customer-documents")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    return { ok: false, error: `Storage upload failed: ${uploadError.message}` };
  }

  // ── 3. Insert document record ──────────────────────────────────────────────
  const { data: doc, error: insertError } = await supabase
    .from("customer_documents")
    .insert([{
      travel_request_id: requestId,
      client_user_id: clientUserId,
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      status: "uploaded",
    }])
    .select()
    .single();

  if (insertError) {
    // Best-effort: try to clean up the orphaned storage file
    await supabase.storage.from("customer-documents").remove([filePath]).catch(() => {});
    return { ok: false, error: `Database insert failed: ${insertError.message}` };
  }

  // ── 4. Update completion percentage ───────────────────────────────────────
  await supabase
    .rpc("update_document_completion", { request_id: requestId })
    .catch((err: unknown) => {
      console.warn("[document-upload] completion RPC failed (non-fatal):", err);
    });

  // ── 5. Notify CRM — FIRE AND FORGET ───────────────────────────────────────
  // This runs after we already return success to the user.
  // Failures are logged to system_logs by the adapter.
  Promise.resolve().then(() => {
    crmAdapter.notifyCrmDocumentUploaded(requestId, documentType, filePath);
  });

  return { ok: true, document: doc as CustomerDocument };
}

/**
 * Delete a document — removes from storage + database.
 * Also fire-and-forgets completion percentage update.
 */
export async function deleteDocument(documentId: string): Promise<UploadResult> {
  const { data: doc, error: fetchErr } = await supabase
    .from("customer_documents")
    .select("file_path, travel_request_id")
    .eq("id", documentId)
    .single();

  if (fetchErr || !doc) {
    return { ok: false, error: fetchErr?.message ?? "Document not found" };
  }

  const { file_path, travel_request_id } = doc as {
    file_path: string | null;
    travel_request_id: string;
  };

  // Remove from storage (best-effort)
  if (file_path) {
    await supabase.storage.from("customer-documents").remove([file_path]).catch(() => {});
  }

  const { error: delErr } = await supabase
    .from("customer_documents")
    .delete()
    .eq("id", documentId);

  if (delErr) {
    return { ok: false, error: delErr.message };
  }

  // Update completion async
  supabase.rpc("update_document_completion", { request_id: travel_request_id }).catch(() => {});

  return { ok: true, document: { id: documentId } as CustomerDocument };
}
