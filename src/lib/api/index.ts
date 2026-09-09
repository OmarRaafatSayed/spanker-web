/**
 * API Utilities - Main Export
 * 
 * Centralized exports for all API utilities
 */

// Supabase clients
export { createServerClient as createSupabaseServerClient } from '@/lib/supabase/server';
export { createSupabaseAdminClient } from './supabase-server';

// Error handling
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  handleRPCError,
  RPC_ERROR_MAP,
} from './errors';

// Response formatting
export {
  successResponse,
  createdResponse,
  noContentResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  isSuccessResponse,
  isErrorResponse,
} from './response';

export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
} from './response';

// Authentication & Authorization
export {
  getCurrentUser,
  requireUser,
  requireStaff,
  requireAdmin,
  requireOwnerOrStaff,
  requireCompleteProfile,
  isStaffUser,
  isAdmin,
  isReviewer,
  isAgent,
} from './auth';

export type { AuthUser, StaffUser } from './auth';
