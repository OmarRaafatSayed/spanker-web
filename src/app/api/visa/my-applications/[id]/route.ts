/**
 * GET /api/visa/my-applications/[id]
 * ====================================
 * Single visa application detail for the authenticated customer.
 *
 * REFACTORED (Task 2):
 *   - Removed inline STATUS_MAP — uses mapCrmStatusToPortal() from visa-states
 *   - Falls back from /my-applications/:id → /applications/:id automatically
 *   - Normalises notes field name discrepancy
 */

import { NextRequest, NextResponse } from "next/server";
import { mapCrmStatusToPortal } from "@/types/visa-states";

const BACKEND =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

function normalizeApplication(app: Record<string, unknown>) {
  return {
    ...app,
    status:
      typeof app.status === "number"
        ? mapCrmStatusToPortal(app.status)
        : app.status,
    notes: (app.notes ?? app.appointment_notes ?? null) as string | null,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const urls = [
    `${BACKEND}/visa/my-applications/${id}`,
    `${BACKEND}/visa/applications/${id}`,
  ];

  let lastError = "";

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text();
        lastError = body;
        if (res.status === 404) continue;
        return NextResponse.json({ error: lastError }, { status: res.status });
      }

      const data = (await res.json()) as Record<string, unknown>;
      return NextResponse.json(normalizeApplication(data));
    } catch (err) {
      lastError = String(err);
    }
  }

  return NextResponse.json(
    { error: lastError || "Not found" },
    { status: 404 }
  );
}
