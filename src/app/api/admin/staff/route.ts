import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);

    // Fetch all staff members
    const { data: staffProfiles, error } = await supabase
      .from(TABLES.profiles)
      .select('id, full_name, email, role')
      .in('role', ['staff', 'admin'])
      .order('full_name', { ascending: true });

    if (error) throw new AppError(error.message, 500);

    const staff = (staffProfiles || []).map((p) => ({
      id: p.id,
      name: p.full_name || p.email || 'Unknown',
      email: p.email,
      role: p.role,
    }));

    return successResponse(staff);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
