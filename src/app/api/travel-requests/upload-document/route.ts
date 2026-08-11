/**
 * POST /api/travel-requests/upload-document
 * Receives a multipart form, uploads file to Supabase Storage,
 * inserts record into customer_documents — all with service_role key.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
           ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file          = form.get("file")         as File   | null;
    const requestId     = form.get("requestId")    as string | null;
    const clientUserId  = form.get("clientUserId") as string | null;
    const documentType  = form.get("documentType") as string | null;

    if (!file || !requestId || !clientUserId || !documentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getServiceClient();

    // ── Step 1: verify bucket exists ─────────────────────────────────────────
    const { data: buckets, error: bucketsErr } = await db.storage.listBuckets();
    if (bucketsErr) {
      return NextResponse.json({ error: `Cannot list buckets: ${bucketsErr.message}` }, { status: 500 });
    }
    const bucketNames = (buckets ?? []).map((b: { name: string }) => b.name);
    const BUCKET = bucketNames.includes("customer-documents") ? "customer-documents"
                 : bucketNames.includes("customer_documents") ? "customer_documents"
                 : bucketNames[0] ?? "customer-documents";

    // Build storage path
    const ext      = file.name.split(".").pop() ?? "bin";
    const fileName = `${Date.now()}_${documentType}.${ext}`;
    const filePath = `documents/${clientUserId}/${requestId}/${fileName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload-document] Storage error:", uploadError);
      return NextResponse.json({
        error: `Storage: ${uploadError.message}`,
        bucket: BUCKET,
        availableBuckets: bucketNames,
      }, { status: 500 });
    }

    // Insert document record
    const { data: doc, error: insertError } = await db
      .from("customer_documents")
      .insert([{
        travel_request_id: requestId,
        client_user_id:    clientUserId,
        document_type:     documentType,
        file_path:         filePath,
        file_name:         file.name,
        file_size:         file.size ?? null,
        mime_type:         file.type,
        status:            "uploaded",
      }])
      .select()
      .single();

    if (insertError) {
      console.error("[upload-document] DB insert error:", insertError);
      await db.storage.from("customer-documents").remove([filePath]).catch(() => {});
      return NextResponse.json({ error: `DB: ${insertError.message}` }, { status: 500 });
    }

    // Update completion percentage (non-blocking, best-effort)
    try {
      await db.rpc("update_document_completion", { request_id: requestId });
    } catch {
      // non-fatal — ignore
    }

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
