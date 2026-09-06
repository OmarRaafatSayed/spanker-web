/**
 * system-logger.ts
 * Fire-and-forget logging to Supabase system_logs table.
 * Single responsibility: logging only.
 */

import { supabase } from "@/lib/supabase";

export async function logToSystemLogs(
  level: "info" | "success" | "warning" | "error",
  event: string,
  details?: string,
  source: "webhook" | "crm" | "cms" | "auth" | "system" = "crm",
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("system_logs").insert([{
      level,
      event,
      details: details ?? null,
      source,
      metadata: metadata ?? {},
    }]);
  } catch (err) {
    console.error("[system-logger] Failed to write log:", err);
  }
}
