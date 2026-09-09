/**
 * Authentication & Authorization Middleware
 * 
 * Helper functions to enforce auth requirements in API routes
 */

import { createServerClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { AuthenticationError, AuthorizationError } from './errors';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface AuthUser {
  id: string;
  email?: string;
  isStaff: boolean;
  staffRole?: 'admin' | 'agent' | 'reviewer';
}

export interface StaffUser extends AuthUser {
  isStaff: true;
  staffRole: 'admin' | 'agent' | 'reviewer';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Core Auth Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get current authenticated user (nullable)
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Check if user is staff (staff are profiles with specific roles)
  const { data: profileRecord } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const isStaff = profileRecord?.role && ['staff', 'admin', 'super_admin'].includes(profileRecord.role);
  const staffRole = isStaff 
    ? (profileRecord.role === 'admin' || profileRecord.role === 'super_admin' ? 'admin' : 'agent') as 'admin' | 'agent' | 'reviewer'
    : undefined;

  return {
    id: user.id,
    email: user.email,
    isStaff,
    staffRole: staffRole,
  };
}

/**
 * Require authenticated user
 * Throws AuthenticationError if not authenticated
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return user;
}

/**
 * Require staff user with optional role check
 * Throws AuthenticationError if not authenticated
 * Throws AuthorizationError if not staff or wrong role
 */
export async function requireStaff(
  allowedRoles?: Array<'admin' | 'agent' | 'reviewer'>
): Promise<StaffUser> {
  const user = await requireUser();

  if (!user.isStaff || !user.staffRole) {
    throw new AuthorizationError('Staff access required');
  }

  // Check specific role if provided
  if (allowedRoles && !allowedRoles.includes(user.staffRole)) {
    throw new AuthorizationError(
      `Access denied: requires one of [${allowedRoles.join(', ')}]`
    );
  }

  return user as StaffUser;
}

/**
 * Require admin user
 * Throws AuthenticationError if not authenticated
 * Throws AuthorizationError if not admin
 */
export async function requireAdmin(): Promise<StaffUser> {
  return requireStaff(['admin']);
}

/**
 * Check if current user owns a resource
 * Throws AuthenticationError if not authenticated
 * Throws AuthorizationError if not owner and not staff
 */
export async function requireOwnerOrStaff(resourceOwnerId: string): Promise<AuthUser> {
  const user = await requireUser();

  // Staff can access any resource
  if (user.isStaff) {
    return user;
  }

  // Non-staff must be the owner
  if (user.id !== resourceOwnerId) {
    throw new AuthorizationError('Access denied: not resource owner');
  }

  return user;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Profile Completeness Check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Check if user has complete profile (required for bookings)
 * Throws AuthorizationError if profile incomplete
 */
export async function requireCompleteProfile(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_profile_complete')
    .eq('id', userId)
    .single();

  if (!profile?.is_profile_complete) {
    throw new AuthorizationError(
      'Complete your profile before making a booking'
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Guards
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function isStaffUser(user: AuthUser): user is StaffUser {
  return user.isStaff && !!user.staffRole;
}

export function isAdmin(user: AuthUser): boolean {
  return isStaffUser(user) && user.staffRole === 'admin';
}

export function isReviewer(user: AuthUser): boolean {
  return isStaffUser(user) && user.staffRole === 'reviewer';
}

export function isAgent(user: AuthUser): boolean {
  return isStaffUser(user) && user.staffRole === 'agent';
}
