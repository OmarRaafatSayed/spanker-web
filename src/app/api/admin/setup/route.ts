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

    // 2. Insert staff record
    const { error: staffError } = await supabase.from('staff').insert({
      user_id: authData.user.id,
      full_name,
      email,
      role: 'admin',
      is_active: true,
    });

    if (staffError) throw staffError;

    return successResponse(
      { user_id: authData.user.id, email, role: 'admin' },
      'Admin user created successfully'
    );
  } catch (error: any) {
    console.error('[POST /api/admin/setup] Error:', error);
    return errorResponse(error);
  }
}
