/**
 * GET /api/admin/crm/status
 * Ping FastAPI health endpoint.
 * Returns { reachable, latency_ms, version? }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const backendUrl = process.env.BACKEND_INTERNAL_URL;

  if (!backendUrl) {
    return NextResponse.json({
      success: true,
      data: {
        reachable:   false,
        latency_ms:  null,
        version:     null,
        error:       "BACKEND_INTERNAL_URL is not configured",
      },
    });
  }

  const start = Date.now();

  try {
    const res = await fetch(`${backendUrl}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(8_000),
      headers: { "Accept": "application/json" },
    });

    const latency = Date.now() - start;
    let version: string | undefined;

    if (res.ok) {
      try {
        const body = await res.json() as Record<string, unknown>;
        version = (body?.version as string | undefined) ??
                  (body?.api_version as string | undefined) ??
                  undefined;
      } catch {
        // non-JSON health response is fine
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reachable:  res.ok,
        latency_ms: latency,
        status_code: res.status,
        version:    version ?? null,
      },
    });
  } catch (err) {
    const latency = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);

    return NextResponse.json({
      success: true,
      data: {
        reachable:  false,
        latency_ms: latency,
        version:    null,
        error:      message,
      },
    });
  }
}
