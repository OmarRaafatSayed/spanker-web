/**
 * POST /api/admin/setup
 * 
 * Initial setup endpoint to create first admin user
 * This should be secured in production (e.g., only run once, require secret token)
 */

import { NextRequest } from 'next/server';
import { createSupabaseServerClient, successResponse, errorResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await request.json();

    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
      return errorResponse(new Error('email, password, and full_name are required'));
    }

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Update profile to admin role (profiles created automatically by trigger)
    const { error: profileError } = await supabase.from('profiles').update({
      role: 'admin',
      full_name,
    }).eq('user_id', authData.user.id);

    if (profileError) throw profileError;

    return successResponse(
      { user_id: authData.user.id, email, role: 'admin' },
      'Admin user created successfully'
    );
  } catch (error: any) {
    console.error('[POST /api/admin/setup] Error:', error);
    return errorResponse(error);
  }
}
