/**
 * POST /api/admin/upload/image
 * Generic image upload to Supabase Storage.
 * Returns public URL.
 *
 * multipart/form-data fields:
 *   file    – image file (jpg | png | webp only, max 5 MB)
 *   bucket  – packages | banners | offers | hotels  (default: banners)
 *
 * Storage path: {bucket}/{userId}/{timestamp}_{sanitized_filename}
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import { logToSystemLogs } from "@/lib/services/system-logger";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

const ALLOWED_BUCKETS  = ["packages", "banners", "offers", "hotels"] as const;
const ALLOWED_MIME     = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXT      = ["jpg", "jpeg", "png", "webp"];
const MAX_SIZE_BYTES   = 5 * 1024 * 1024; // 5 MB

type AllowedBucket = (typeof ALLOWED_BUCKETS)[number];

/** Strip any characters that aren't alphanumeric, dash, underscore, or dot */
function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.+/g, ".")          // collapse multiple dots
    .slice(0, 100);                // hard cap
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  // Parse multipart form
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Request must be multipart/form-data" },
      { status: 400 }
    );
  }

  const file       = form.get("file") as File | null;
  const bucketRaw  = (form.get("bucket") as string | null) ?? "banners";

  // ── Validate file presence ────────────────────────────────────────────────
  if (!file || typeof file.name !== "string") {
    return NextResponse.json(
      { success: false, error: "file is required" },
      { status: 400 }
    );
  }

  // ── Validate bucket ───────────────────────────────────────────────────────
  const bucket = bucketRaw.toLowerCase() as AllowedBucket;
  if (!ALLOWED_BUCKETS.includes(bucket)) {
    return NextResponse.json(
      { success: false, error: `bucket must be one of: ${ALLOWED_BUCKETS.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Validate MIME type ────────────────────────────────────────────────────
  const mime = file.type.toLowerCase();
  if (!ALLOWED_MIME.includes(mime as (typeof ALLOWED_MIME)[number])) {
    return NextResponse.json(
      { success: false, error: "Only jpg, png, and webp images are allowed" },
      { status: 415 }
    );
  }

  // ── Validate extension ────────────────────────────────────────────────────
  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(rawExt)) {
    return NextResponse.json(
      { success: false, error: "File extension must be jpg, jpeg, png, or webp" },
      { status: 415 }
    );
  }

  // ── Validate file size ────────────────────────────────────────────────────
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: `File size exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)` },
      { status: 413 }
    );
  }

  // ── Build storage path ────────────────────────────────────────────────────
  const safeName  = sanitizeFilename(file.name);
  const ext       = rawExt === "jpeg" ? "jpg" : rawExt; // normalise jpeg → jpg
  const baseName  = safeName.replace(/\.[^.]+$/, "");   // strip extension
  const fileName  = `${Date.now()}_${baseName}.${ext}`;
  const filePath  = `${auth.userId}/${fileName}`;

  const supabase = getServiceClient();

  // ── Upload ────────────────────────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, arrayBuffer, {
      contentType: mime,
      upsert:      false,
    });

  if (uploadError) {
    console.error("[admin/upload/image POST]", uploadError);

    // Bucket might not exist yet — surface a clear error
    if (
      uploadError.message?.includes("not found") ||
      uploadError.message?.includes("does not exist")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Storage bucket '${bucket}' does not exist. Create it in Supabase Storage first.`,
          details: uploadError.message,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Upload failed", details: uploadError.message },
      { status: 500 }
    );
  }

  // ── Get public URL ────────────────────────────────────────────────────────
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);

  await logToSystemLogs(
    "success",
    "image_uploaded",
    `Image uploaded to ${bucket}/${filePath}`,
    "cms",
    {
      bucket,
      path:       filePath,
      size_bytes: file.size,
      mime,
      uploaded_by: auth.userId,
    }
  );

  return NextResponse.json(
    {
      success:    true,
      data: {
        url:      publicUrl,
        path:     filePath,
        bucket,
        filename: fileName,
        size:     file.size,
        mime,
      },
    },
    { status: 201 }
  );
}
