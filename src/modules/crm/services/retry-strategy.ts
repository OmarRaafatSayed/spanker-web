/**
 * retry-strategy.ts
 * Exponential backoff retry logic for transient failures.
 * Single responsibility: retry logic only.
 */

import { type ServiceResult } from "./api-client";

export async function withRetry<T>(
  fn: () => Promise<ServiceResult<T>>,
  maxAttempts = 3,
  baseDelayMs = 500
): Promise<ServiceResult<T>> {
  let lastResult: ServiceResult<T> = { ok: false, error: "Not attempted" };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await fn();
    if (lastResult.ok) return lastResult;

    // Don't retry on auth errors or client errors (4xx)
    if (lastResult.status && lastResult.status >= 400 && lastResult.status < 500) {
      return lastResult;
    }

    if (attempt < maxAttempts) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  return lastResult;
}
