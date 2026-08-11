"use client";

/**
 * Admin route error boundary.
 * Next.js renders this automatically when a server component or async
 * operation inside /admin throws an unhandled error.
 *
 * DEGRADATION STRATEGY:
 *   - Displays a human-readable message in Arabic (staff-facing)
 *   - Offers a "try again" button that calls reset() to re-render the segment
 *   - Never exposes raw error details in production
 */

import { useEffect } from "react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    // Log to console in dev; in production wire to your observability service
    console.error("[admin/error]", error.message, error.digest);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
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
      </div>

      <h2 className="text-lg font-bold text-text-primary mb-2">
        حدث خطأ في لوحة الإدارة
      </h2>

      <p className="text-sm text-text-muted mb-1 max-w-sm">
        تعذّر تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للوحة الرئيسية.
      </p>

      {/* Show technical detail only in development */}
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
          href="/admin"
          className="px-5 py-2.5 border border-border-light text-sm font-medium text-text-secondary rounded-xl hover:bg-bg-alt transition"
        >
          لوحة التحكم
        </a>
      </div>
    </div>
  );
}
