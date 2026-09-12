import { supabase } from "@/lib/supabase/client";
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

export async function uploadDocument(params: UploadDocumentParams): Promise<UploadResult> {
  const { requestId, clientUserId, documentType, file } = params;

  const ext = file.name.split(".").pop() ?? "bin";
  const fileName = `${Date.now()}_${documentType}.${ext}`;
  const filePath = `documents/${clientUserId}/${requestId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("customer-documents")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    return { ok: false, error: `Storage upload failed: ${uploadError.message}` };
  }

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
    await supabase.storage.from("customer-documents").remove([filePath]).catch(() => {});
    return { ok: false, error: `Database insert failed: ${insertError.message}` };
  }

  void (async () => {
    try {
      await supabase.rpc("update_document_completion", { request_id: requestId });
    } catch (err: unknown) {
      console.warn("[document-upload] completion RPC failed (non-fatal):", err);
    }
  })();

  return { ok: true, document: doc as CustomerDocument };
}

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

  void (async () => {
    try {
      await supabase.rpc("update_document_completion", { request_id: travel_request_id });
    } catch {}
  })();

  return { ok: true, document: { id: documentId } as CustomerDocument };
}
