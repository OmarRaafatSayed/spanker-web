import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const staff = await requireStaff(supabase);

    // Get staff's profile ID (assigned_staff_id references profiles.id)
    const { data: profile, error: profileError } = await supabase
      .from(TABLES.profiles)
      .select('id')
      .eq('user_id', staff.id)
      .single();

    if (profileError || !profile) throw new AppError('Staff profile not found', 404);

    const { data: bookings, error } = await supabase
      .from(TABLES.travelRequests)
      .select(
        'id, booking_reference, vertical, booking_status, total_amount, created_at, client_user_id'
      )
      .eq('assigned_staff_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(error.message, 500);

    // Fetch customer names separately to avoid join-shape issues
    const clientIds = [...new Set((bookings ?? []).map((b) => b.client_user_id).filter(Boolean))];
    let clientMap: Record<string, { full_name: string | null; email: string | null }> = {};

    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from(TABLES.profiles)
        .select('user_id, full_name, email')
        .in('user_id', clientIds as string[]);
      for (const p of profiles ?? []) {
        if (p.user_id) clientMap[p.user_id] = { full_name: p.full_name, email: p.email };
      }
    }

    const assignments = (bookings ?? []).map((b) => ({
      id: b.id,
      reference_number: b.booking_reference,
      vertical: b.vertical,
      booking_status: b.booking_status,
      total_amount: b.total_amount,
      created_at: b.created_at,
      client_name: clientMap[b.client_user_id ?? '']?.full_name ?? null,
      client_email: clientMap[b.client_user_id ?? '']?.email ?? null,
    }));

    return successResponse(assignments);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
