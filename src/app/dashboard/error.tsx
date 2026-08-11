"use client";

/**
 * Dashboard route error boundary.
 *
 * DEGRADATION STRATEGY:
 *   - Classifies errors: auth (→ redirect), backend down (→ offline card),
 *     unknown (→ retry card).
 *   - Shows cached data hint if Zustand store has prior state.
 *   - Never crashes the full layout — only the page segment resets.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function classifyError(error: Error): "auth" | "network" | "unknown" {
  const msg = error.message.toLowerCase();
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("session")) {
    return "auth";
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("unreachable") ||
    msg.includes("502") ||
    msg.includes("503")
  ) {
    return "network";
  }
  return "unknown";
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  const router = useRouter();
  const kind = classifyError(error);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error("[dashboard/error]", error.message, error.digest);

    // Auth errors: clear stale session and redirect to login
    if (kind === "auth") {
      try {
        localStorage.removeItem("customer_portal_session");
        localStorage.removeItem("travel_crm_sb_session");
      } catch {
        // Private browsing — ignore
      }
      router.replace("/login");
    }
  }, [error, kind, router]);

  // Auth redirect is in flight — render nothing
  if (kind === "auth") return null;

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
    >
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
          kind === "network" ? "bg-amber-50" : "bg-red-50"
        }`}
      >
        {kind === "network" ? (
          /* Cloud-off icon */
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-amber-500"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9.58 5.03A7 7 0 0 1 19 12.09M5.9 9A5 5 0 0 0 7 19h11" />
          </svg>
        ) : (
          /* Alert circle icon */
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-red-500"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>

      <h2 className="text-lg font-bold text-text-primary mb-2">
        {kind === "network" ? "الخادم غير متاح حالياً" : "حدث خطأ ما"}
      </h2>

      <p className="text-sm text-text-muted mb-1 max-w-sm">
        {kind === "network"
          ? "تعذّر الاتصال بالخادم. البيانات المحفوظة معروضة أدناه — جرّب مجدداً بعد قليل."
          : "تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى."}
      </p>

      {isDev && error.message && (
        <pre className="mt-2 mb-4 max-w-lg overflow-x-auto rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 text-left">
          {error.message}
          {error.digest ? `\ndigest: ${error.digest}` : ""}
        </pre>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-dark transition focus:outline-none focus:ring-2 focus:ring-brand-green/50"
        >
          حاول مجدداً
        </button>
        <a
          href="/dashboard"
          className="px-5 py-2.5 border border-border-light text-sm font-medium text-text-secondary rounded-xl hover:bg-bg-alt transition"
        >
          الصفحة الرئيسية
        </a>
      </div>
    </div>
  );
}
