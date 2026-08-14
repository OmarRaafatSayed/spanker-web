/**
 * GET /api/admin/customers/[id]/documents
 * Fetch all documents for a specific customer
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;

    // First, get the customer's user_id
    const { data: customer, error: customerError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch documents for this customer
    const { data: documents, error: documentsError } = await supabase
      .from("customer_documents")
      .select("*")
      .eq("client_user_id", customer.user_id)
      .order("created_at", { ascending: false });

    if (documentsError) {
      console.error("[documents] Error:", documentsError);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
    });
  } catch (err) {
    console.error("[documents] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
