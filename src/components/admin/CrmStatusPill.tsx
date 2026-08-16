"use client";

/**
 * CrmStatusPill
 * Polls /api/admin/crm/status every 60 seconds.
 * Green = ok, Yellow = degraded, Red = error/unreachable.
 */

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type CrmStatus = "ok" | "degraded" | "error" | "loading";

interface StatusData {
  reachable: boolean;
  latency_ms: number | null;
  version?: string | null;
  error?: string | null;
}

const CONFIG: Record<CrmStatus, { dot: string; badge: string; label: string }> = {
  ok:       { dot: "bg-green-400",  badge: "bg-green-50 text-green-700 border-green-200",  label: "CRM متصل"     },
  degraded: { dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "CRM بطيء"    },
  error:    { dot: "bg-red-400",    badge: "bg-red-50 text-red-700 border-red-200",         label: "CRM غير متصل" },
  loading:  { dot: "bg-gray-300",   badge: "bg-gray-50 text-gray-500 border-gray-200",      label: "..."          },
};

function resolveStatus(data: StatusData): CrmStatus {
  if (!data.reachable) return "error";
  if (data.latency_ms && data.latency_ms > 2000) return "degraded";
  return "ok";
}

export function CrmStatusPill() {
  const [status, setStatus]     = useState<CrmStatus>("loading");
  const [latency, setLatency]   = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crm/status", {
        headers: { Authorization: `Bearer ${_getToken()}` },
      });
      if (!res.ok) { setStatus("error"); return; }
      const json = await res.json() as { success: boolean; data: StatusData };
      if (json.success) {
        setStatus(resolveStatus(json.data));
        setLatency(json.data.latency_ms);
        setLastChecked(new Date());
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [check]);

  const cfg = CONFIG[status];

  return (
    <button
      onClick={check}
      title={latency ? `${latency}ms${lastChecked ? ` · ${lastChecked.toLocaleTimeString("ar-EG")}` : ""}` : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all",
        cfg.badge
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot,
        status === "ok" && "animate-pulse"
      )} />
      <span className="hidden sm:inline">{cfg.label}</span>
      {latency && status !== "loading" && (
        <span className="hidden md:inline opacity-60">{latency}ms</span>
      )}
    </button>
  );
}

/** Read JWT from localStorage session (mirrors auth-context pattern) */
function _getToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("customer_portal_session");
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { session?: { access_token?: string } };
    return parsed?.session?.access_token ?? "";
  } catch {
    return "";
  }
}
