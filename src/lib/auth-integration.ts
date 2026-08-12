/**
 * auth-integration.ts
 * ===================
 * Unified authentication integration layer.
 * Coordinates signup flow: Auth → Profile → Event Dispatch → CRM Sync.
 * 
 * CONTRACT:
 *   - unifiedSignup() returns immediately after auth + profile creation
 *   - Event dispatch (UserRegistered) happens async in background
 *   - CRM provisioning queued via sync_queue table
 *   - All errors logged to system_logs for audit trail
 */

import { supabase } from "@/lib/supabase";
import { crmAdapter, type ServiceResult } from "@/lib/services/crm-adapter";
import { registrationEventDispatcher } from "@/lib/services/registration-event-dispatcher";

interface UnifiedSignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface UnifiedSignupResponse {
  success: boolean;
  userId?: string;
  email?: string;
  requiresEmailConfirmation?: boolean;
  eventId?: string;
  message: string;
}

/**
 * Unified signup orchestrator:
 * 
 * 1. Call CRM adapter signup (creates auth.users + returns session)
 * 2. Create portal profiles record for tracking
 * 3. Dispatch UserRegistered event (async, non-blocking)
 * 4. Return immediately with user ID
 * 
 * Background async:
 * - Event handlers trigger (email, CRM provisioning, analytics)
 * - sync_queue entries created for Portal → CRM sync
 */
export async function unifiedSignup(
  request: UnifiedSignupRequest
): Promise<UnifiedSignupResponse> {
  try {
    // Step 1: Call FastAPI /auth/register endpoint
    const authResult = await crmAdapter.signup(
      request.email,
      request.password,
      request.firstName,
      request.lastName,
      request.phone,
      "customer"
    );

    if (!authResult.ok) {
      return {
        success: false,
        message: authResult.error,
      };
    }

    const { user: apiUser, session, email_confirmation_required } = authResult.data;

    // If email confirmation is required, return early
    if (email_confirmation_required) {
      return {
        success: true,
        userId: apiUser.id,
        email: apiUser.email,
        requiresEmailConfirmation: true,
        message: "Email confirmation required. Check your inbox.",
      };
    }

    // Step 2: Create portal profile record (for Portal DB audit trail)
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: apiUser.id,
      full_name: [request.firstName, request.lastName].filter(Boolean).join(" "),
      phone: request.phone || "",
      role: "customer",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("[auth-integration] Profile creation failed:", profileError);
      // Log but don't fail — profile may have been created server-side
      await logSignupEvent("error", apiUser.id, request.email, {
        stage: "profile_creation",
        error: profileError.message,
      });
    }

    // Step 3: Dispatch UserRegistered event async (fire & forget)
    // This queues CRM provisioning without blocking response
    const eventPromise = registrationEventDispatcher
      .dispatchUserRegistered({
        eventType: "UserRegistered",
        timestamp: Date.now(),
        user: {
          id: apiUser.id,
          email: apiUser.email,
          firstName: request.firstName,
          lastName: request.lastName,
          phone: request.phone,
        },
        source: "portal",
      })
      .catch(err => {
        console.error("[auth-integration] Event dispatch failed:", err);
        logSignupEvent("error", apiUser.id, request.email, {
          stage: "event_dispatch",
          error: String(err),
        }).catch(e => console.error("[auth-integration] Failed to log event error:", e));
      });

    // Log success (don't await)
    logSignupEvent("success", apiUser.id, request.email, {
      stage: "completed",
      firstName: request.firstName,
      phone: request.phone,
    }).catch(e => console.error("[auth-integration] Failed to log success:", e));

    // Return immediately (don't await event promise)
    return {
      success: true,
      userId: apiUser.id,
      email: apiUser.email,
      eventId: undefined, // Will be available after event dispatch completes
      message: "Account created successfully. Provisioning in progress...",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth-integration] Signup failed:", message);
    
    return {
      success: false,
      message,
    };
  }
}

/**
 * Helper: Log signup event to system_logs
 */
async function logSignupEvent(
  level: "info" | "success" | "error" | "warning",
  userId: string,
  email: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("system_logs").insert({
      level,
      event: "user_registration",
      details: `User ${email} (${userId})`,
      source: "auth",
      metadata: metadata
        ? { userId, email, ...metadata }
        : { userId, email },
    });
  } catch (err) {
    console.error("[auth-integration] Failed to log signup event:", err);
  }
}

/**
 * Helper: Get the status of a registration event
 */
export async function getRegistrationEventStatus(eventId: string): Promise<{
  status: "pending" | "processed" | "failed";
  error?: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from("event_log")
      .select("status, error_message")
      .eq("id", eventId)
      .single();

    if (error) return null;
    if (!data) return null;

    return {
      status: data.status as "pending" | "processed" | "failed",
      error: data.error_message || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Helper: Check if user profile is synced to CRM
 */
export async function isUserSyncedToCrm(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("sync_status")
      .eq("user_id", userId)
      .single();

    if (error) return false;
    return data?.sync_status === "synced";
  } catch {
    return false;
  }
}
