// =============================================================================
// Supabase Client — Re-exports for backward compatibility
// =============================================================================

/**
 * @deprecated Import from @/lib/supabase/client or @/lib/supabase/server instead
 * This file is kept for backward compatibility during migration
 */

// For client-side code
export { supabase, createClient } from "@/lib/supabase/client";

// Note: For server-side code, import createServerClient from @/lib/supabase/server
// Example: const supabase = await createServerClient();
