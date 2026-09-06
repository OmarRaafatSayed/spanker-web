/**
 * Registration Event Dispatcher
 * كل تسجيل جديد:
 * 1. ينشئ auth.users
 * 2. ينشئ profiles 
 * 3. يطلق UserRegistered event
 * 4. يزود CRM profile async
 * 5. يسجل في system_logs
 */

import { createClient } from "@supabase/supabase-js";

export interface UserRegisteredEvent {
  eventType: "UserRegistered";
  timestamp: number;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  source: "portal" | "crm";
}

export interface EventDispatchResult {
  success: boolean;
  eventId: string;
  timestamp: number;
  message: string;
  errors?: string[];
}

class RegistrationEventDispatcher {
  private supabaseUrl: string;
  private supabaseServiceRoleKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  }

  async dispatchUserRegistered(
    event: UserRegisteredEvent
  ): Promise<EventDispatchResult> {
    const eventId = this.generateEventId();
    const timestamp = Date.now();

    try {
      this.validateUserRegisteredEvent(event);
      await this.logEvent(eventId, event as unknown as Record<string, unknown>);
      
      // Fire & forget handlers
      this.handleUserRegisteredAsync(eventId, event).catch((err) => {
        console.error(`❌ Handler error [${eventId}]:`, err);
      });

      return {
        success: true,
        eventId,
        timestamp,
        message: `UserRegistered event dispatched - Async provisioning in progress`,
      };
    } catch (error) {
      const errorMsg = String(error);
      console.error(`❌ Event dispatch failed [${eventId}]:`, errorMsg);

      return {
        success: false,
        eventId,
        timestamp,
        message: "Event dispatch failed",
        errors: [errorMsg],
      };
    }
  }

  private async handleUserRegisteredAsync(
    eventId: string,
    event: UserRegisteredEvent
  ): Promise<void> {
    const handlers = [
      this.provisionCRMProfile(eventId, event),
      this.sendWelcomeEmail(eventId, event),
      this.trackSignupMetric(eventId, event),
    ];

    const results = await Promise.allSettled(handlers);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "rejected") {
        console.error(`Handler ${i} failed [${eventId}]:`, result.reason);
        await this.logError(eventId, `Handler ${i} failed`, result.reason);
      }
    }
  }

  private async provisionCRMProfile(
    eventId: string,
    event: UserRegisteredEvent
  ): Promise<void> {
    console.log(`📋 Queuing CRM profile for sync [${eventId}]...`);

    try {
      const supabase = createClient(
        this.supabaseUrl,
        this.supabaseServiceRoleKey
      );

      // Step 1: Insert profile locally first (for Portal DB audit trail)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: event.user.id,
          full_name: [event.user.firstName, event.user.lastName].filter(Boolean).join(" ") || event.user.email,
          phone: event.user.phone || "",
          role: "customer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (profileError) throw profileError;

      // Step 2: Queue profile for CRM sync (async)
      const { error: queueError } = await supabase.from("sync_queue").insert({
        entity_type: "profile",
        entity_id: profile.id,
        direction: "portal_to_crm",
        payload: {
          full_name: event.user.firstName && event.user.lastName 
            ? `${event.user.firstName} ${event.user.lastName}`
            : event.user.email,
          phone: event.user.phone || "",
          email: event.user.email,
        },
        status: "pending",
        retry_count: 0,
      });

      if (queueError) throw queueError;

      console.log(`✅ CRM profile queued for sync [${eventId}]`);
      await this.logEvent(
        eventId,
        {
          action: "CRMProfileQueued",
          profile_id: profile.id,
          user_id: event.user.id,
          email: event.user.email,
          message: "Profile added to sync queue for background processing",
        },
        "success"
      );
    } catch (error) {
      console.error(`❌ CRM provisioning failed [${eventId}]:`, error);
      throw error;
    }
  }

  private async sendWelcomeEmail(
    eventId: string,
    event: UserRegisteredEvent
  ): Promise<void> {
    console.log(`📧 Welcome email queued [${eventId}]...`);
    // TODO: Integrate with email service
  }

  private async trackSignupMetric(
    eventId: string,
    event: UserRegisteredEvent
  ): Promise<void> {
    console.log(`📊 Signup metric tracked [${eventId}]...`);
    // TODO: Send to analytics service
  }

  private validateUserRegisteredEvent(event: UserRegisteredEvent): void {
    if (!event.user.id) throw new Error("Missing user.id");
    if (!event.user.email) throw new Error("Missing user.email");
    if (!event.eventType) throw new Error("Missing eventType");
  }

  private async logEvent(
    eventId: string,
    data: Record<string, unknown>,
    level: "info" | "success" | "warning" | "error" = "info"
  ): Promise<void> {
    try {
      const supabase = createClient(
        this.supabaseUrl,
        this.supabaseServiceRoleKey
      );

      await supabase.from("system_logs").insert({
        level,
        event: "user_registration",
        details: JSON.stringify(data),
        source: "auth",
        metadata: { eventId },
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`⚠️ Failed to log event [${eventId}]:`, error);
    }
  }

  private async logError(
    eventId: string,
    message: string,
    error: unknown
  ): Promise<void> {
    try {
      const supabase = createClient(
        this.supabaseUrl,
        this.supabaseServiceRoleKey
      );

      await supabase.from("system_logs").insert({
        level: "error",
        event: "registration_handler_error",
        details: `${message}: ${String(error)}`,
        source: "auth",
        metadata: { eventId },
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`⚠️ Failed to log error [${eventId}]:`, err);
    }
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const registrationEventDispatcher = new RegistrationEventDispatcher();
export default RegistrationEventDispatcher;
