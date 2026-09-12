import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      throw new AppError('email, password, and full_name are required', 400, 'VALIDATION_ERROR');
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) throw new AppError(authError.message, 500);
    if (!authData.user) throw new AppError('Failed to create user', 500);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin', full_name })
      .eq('user_id', authData.user.id);

    if (profileError) throw new AppError(profileError.message, 500);

    return successResponse({ user_id: authData.user.id, email, role: 'admin' });
  } catch (error) {
    return errorResponse(error as Error);
  }
}
