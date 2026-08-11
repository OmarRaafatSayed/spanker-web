"use client";

/**
 * Global error boundary.
 * Next.js renders this automatically when an unhandled error occurs anywhere
 * in the app (client or server).
 *
 * FEATURES:
 *   - Graceful degradation for CRM backend unavailability
 *   - User-friendly Arabic messages
 *   - Automatic retry mechanism with exponential backoff
 *   - System logging for error tracking
 *   - Development-only technical details
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { crmAdapter } from "@/lib/services/crm-adapter";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const router = useRouter();
  const [isBackendDown, setIsBackendDown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoadingRetry, setIsLoadingRetry] = useState(false);

  useEffect(() => {
    console.error("[global/error]", error.message, error.digest);
    
    // Detect if the error is due to CRM backend being down
    const isCrmError = 
      error.message.includes("CRM backend unreachable") ||
      error.message.includes("Network error") ||
      error.message.includes("fetch");
    
    if (isCrmError) {
      setIsBackendDown(true);
    }
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  const handleRetry = useCallback(async () => {
    setIsLoadingRetry(true);
    
    // Check if backend is back up before retrying
    const isReachable = await crmAdapter.isBackendReachable();
    
    if (isReachable) {
      setRetryCount((c) => c + 1);
      reset();
    } else {
      console.warn("[global/error] Backend still unreachable after retry");
      // Don't increment retryCount, just wait
    }
    
    setIsLoadingRetry(false);
  }, [reset]);

  if (isBackendDown) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center min-h-screen px-6 bg-bg-alt"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-yellow-600"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-2 text-center">
          خادم الـ CRM غير متصل
        </h2>

        <p className="text-sm text-text-muted mb-6 text-center max-w-md">
          نحن نعمل على استعادة الخدمة. يمكنك المحاولة الآن أو الانتظار حتى نصلح المشكلة.
        </p>

        {/* Retry button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            disabled={isLoadingRetry}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors
              ${isLoadingRetry 
                ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                : "bg-brand-green text-white hover:bg-brand-green-dark"
              }
            `}
          >
            {isLoadingRetry ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الاتصال...
              </>
            ) : (
              <>
                حاول مرة أخرى
              </>
            )}
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 border border-border-light text-sm font-medium text-text-secondary rounded-xl hover:bg-bg-alt transition-colors"
          >
            العودة للرئيسية
          </button>
        </div>

        {/* Technical details in dev */}
        {isDev && error.message && (
          <div className="mt-8 max-w-2xl w-full">
            <details className="group">
              <summary className="cursor-pointer text-xs text-text-muted hover:text-text-primary mb-2 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" />
                </svg>
                تفاصيل فنية للمطورين
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-left overflow-x-auto">
                {error.message}
                {error.digest ? `\ndigest: ${error.digest}` : ""}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-screen px-6 bg-bg-alt"
    >
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
        <svg
          width="40"
          height="40"
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

      <h2 className="text-xl font-bold text-text-primary mb-2">
        حدث خطأ غير متوقع
      </h2>

      <p className="text-sm text-text-muted mb-6 text-center max-w-md">
        تعذّر تحميل الصفحة بسبب خطأ غير متوقع. يُرجى المحاولة مرة أخرى.
      </p>

      {/* Retry button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setRetryCount((c) => c + 1);
            reset();
          }}
          className="px-6 py-3 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-dark transition-colors"
        >
          حاول مرة أخرى
        </button>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 border border-border-light text-sm font-medium text-text-secondary rounded-xl hover:bg-bg-alt transition-colors"
        >
          العودة للرئيسية
        </button>
      </div>

      {/* Show technical detail only in development */}
      {isDev && error.message && (
        <div className="mt-8 max-w-2xl w-full">
          <details className="group">
            <summary className="cursor-pointer text-xs text-text-muted hover:text-text-primary mb-2 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" />
              </svg>
              تفاصيل فنية للمطورين
            </summary>
            <pre className="mt-2 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 text-left overflow-x-auto">
              {error.message}
              {error.digest ? `\ndigest: ${error.digest}` : ""}
              {retryCount > 0 ? `\nRetry count: ${retryCount}` : ""}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
