import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';
import { z } from 'zod';

// workflow_settings table is not yet in the generated types, so we use `any` cast
const settingsTable = (supabase: any) => supabase.from('workflow_settings') as any;

const updateSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    await requireStaff(supabase);

    const { data, error } = await settingsTable(supabase).select('*').order('key');
    if (error) throw new AppError(error.message, 500);
    return successResponse(data ?? []);
  } catch (err) {
    return errorResponse(err as Error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireStaff(supabase);

    // Only admins can change settings
    const { data: profile } = await supabase
      .from(TABLES.profiles)
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') return forbiddenResponse();

    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse('Invalid request data');
    }

    const { key, value } = validation.data;

    const { error } = await settingsTable(supabase)
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) throw new AppError(error.message, 500);
    return successResponse({ key, value });
  } catch (err) {
    return errorResponse(err as Error);
  }
}
