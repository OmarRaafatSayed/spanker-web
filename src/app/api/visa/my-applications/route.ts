/**
 * GET /api/visa/my-applications
 * ==============================
 * Server-side Next.js proxy to the FastAPI backend.
 *
 * REFACTORED (Task 1):
 *   - Removed inline STATUS_MAP — integer→slug conversion now uses
 *     mapCrmStatusToPortal() from @/types/visa-states (single source of truth)
 *   - Fallback chain preserved: /visa/my-applications → /visa/applications
 *   - Field normalization (appointment_notes → notes) kept
 */

import { NextRequest, NextResponse } from "next/server";
import { mapCrmStatusToPortal } from "@/types/visa-states";

const BACKEND =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

function normalizeApplication(app: Record<string, unknown>) {
  return {
    ...app,
    // Convert integer CRM status to portal slug. If already a string slug, keep it.
    status:
      typeof app.status === "number"
        ? mapCrmStatusToPortal(app.status)
        : app.status,
    // Normalize field name discrepancy between DB and frontend type
    notes: (app.notes ?? app.appointment_notes ?? null) as string | null,
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    forwardParams.set(key, value);
  }
  const qs = forwardParams.toString();

  // Try dedicated customer endpoint first; fall back to staff endpoint
  const urls = [
    `${BACKEND}/visa/my-applications${qs ? `?${qs}` : ""}`,
    `${BACKEND}/visa/applications${qs ? `?${qs}` : ""}`,
  ];

  let lastError = "";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text();
        lastError = body;
        if (res.status === 404) continue;   // endpoint not deployed yet → try next
        return NextResponse.json({ error: lastError }, { status: res.status });
      }

      const data = (await res.json()) as Record<string, unknown>;

      const rawResults: Record<string, unknown>[] = Array.isArray(data.results)
        ? (data.results as Record<string, unknown>[])
        : Array.isArray(data)
          ? (data as Record<string, unknown>[])
          : [];

      const results = rawResults.map(normalizeApplication);

      return NextResponse.json({ results, count: results.length });
    } catch (err) {
      lastError = String(err);
    }
  }

  return NextResponse.json(
    { error: lastError || "Backend unavailable" },
    { status: 502 }
  );
}
