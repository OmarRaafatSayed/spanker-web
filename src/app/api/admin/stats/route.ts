/**
 * GET /api/admin/stats
 * Dashboard overview card data — all counts run in parallel.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAuth } from "@/lib/admin-auth";
import type { Database } from "@/types/database";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (!auth.ok) return auth.response;

  const supabase = getServiceClient();
  const now      = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // All counts run in parallel
  const [
    totalCustomersResult,
    leadsThisMonthResult,
    pendingLeadsResult,
    activePackagesResult,
    activeOffersResult,
    completedRequestsResult,
    revenueMonthResult,
    lastCrmSyncResult,
    pendingDocsResult,
  ] = await Promise.all([
    // total_customers — profiles with role = 'customer'
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer"),

    // leads_this_month — travel_requests created this calendar month
    supabase
      .from("travel_requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd),

    // pending_leads — status in pending_documents or documents_review
    supabase
      .from("travel_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending_documents", "documents_review"]),

    // active_packages
    supabase
      .from("trip_packages")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),

    // active_offers — active + not expired
    supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`end_date.is.null,end_date.gte.${now.toISOString()}`),

    // completed_requests — all-time
    supabase
      .from("travel_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed"),

    // total_revenue_month — sum of financial_transactions.amount_paid this month
    supabase
      .from("financial_transactions")
      .select("amount_paid")
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd),

    // last_crm_sync — most recent successful webhook receipt in system_logs
    supabase
      .from("system_logs")
      .select("created_at")
      .eq("event", "crm_webhook_received")
      .eq("level", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // pending_documents_count — customer_documents with status = 'uploaded'
    supabase
      .from("customer_documents")
      .select("*", { count: "exact", head: true })
      .eq("status", "uploaded"),
  ]);

  // Calculate revenue sum from rows
  const revenueRows = (revenueMonthResult.data ?? []) as Array<{ amount_paid: number | null }>;
  const totalRevenueMonth = revenueRows.reduce(
    (sum, row) => sum + (row.amount_paid ?? 0),
    0
  );

  // CRM reachability check (non-blocking, 5s timeout)
  let crmSyncStatus: "ok" | "error" | "degraded" = "error";
  const backendUrl = process.env.BACKEND_INTERNAL_URL;
  if (backendUrl) {
    try {
      const start = Date.now();
      const res = await fetch(`${backendUrl}/health`, {
        signal: AbortSignal.timeout(5_000),
      });
      const latency = Date.now() - start;
      if (res.ok) {
        crmSyncStatus = latency > 2000 ? "degraded" : "ok";
      } else {
        crmSyncStatus = "error";
      }
    } catch {
      crmSyncStatus = "error";
    }
  } else {
    crmSyncStatus = "error";
  }

  return NextResponse.json({
    success: true,
    data: {
      total_customers:        totalCustomersResult.count ?? 0,
      leads_this_month:       leadsThisMonthResult.count ?? 0,
      pending_leads:          pendingLeadsResult.count ?? 0,
      active_packages:        activePackagesResult.count ?? 0,
      active_offers:          activeOffersResult.count ?? 0,
      completed_requests:     completedRequestsResult.count ?? 0,
      total_revenue_month:    totalRevenueMonth,
      crm_sync_status:        crmSyncStatus,
      last_crm_sync:          lastCrmSyncResult.data?.created_at ?? null,
      pending_documents_count: pendingDocsResult.count ?? 0,
    },
  });
}
