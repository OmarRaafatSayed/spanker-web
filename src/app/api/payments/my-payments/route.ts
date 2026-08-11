/**
 * GET /api/payments/my-payments
 *
 * Next.js adapter endpoint — queries the FastAPI backend and normalises
 * field names to match what the frontend PaymentRecord type expects.
 *
 * DB field: `payment_method` → frontend field: `method`
 * DB field: `payment_date`   → used as fallback for `created_at`
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000/api/v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePayment(p: Record<string, any>): Record<string, any> {
  return {
    ...p,
    method: p.method ?? p.payment_method ?? "cash",
    amount: typeof p.amount === "number" ? p.amount : (typeof p.total_amount === "number" ? p.total_amount : 0),
    created_at: p.created_at ?? p.payment_date ?? new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const forwardParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    forwardParams.set(key, value);
  }

  const urls = [
    `${BACKEND}/payments/my-payments?${forwardParams.toString()}`,
    `${BACKEND}/payments?${forwardParams.toString()}`,
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
        if (res.status === 404) continue;
        return NextResponse.json({ error: lastError }, { status: res.status });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as Record<string, any>;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: Record<string, any>[] = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data)
          ? data
          : [];

      const normalized = results.map(normalizePayment);

      const totalAmount = normalized.reduce(
        (sum: number, p: Record<string, any>) => sum + (typeof p.amount === "number" ? p.amount : 0),
        0
      );

      return NextResponse.json({
        results: normalized,
        count: normalized.length,
        total_amount: totalAmount,
      });
    } catch (err) {
      lastError = String(err);
    }
  }

  return NextResponse.json(
    { error: lastError || "Backend unavailable" },
    { status: 502 }
  );
}
