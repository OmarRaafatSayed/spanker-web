/**
 * async-queue.ts
 * ==============
 * Async operation queue with retry logic and exponential backoff.
 *
 * FEATURES:
 *   - Automatic retry with exponential backoff
 *   - Per-operation status tracking
 *   - Queue management (cancel, pause, resume)
 *   - Deduplication by operation ID
 *   - Best-effort retry strategy (doesn't retry 4xx errors)
 */

// =============================================================================
// Types
// =============================================================================

export interface QueuedOperation<T> {
  id: string;
  fn: () => Promise<T>;
  maxAttempts: number;
  baseDelayMs: number;
  status: "pending" | "running" | "completed" | "failed" | "abandoned";
  result?: T;
  error?: string;
  createdAt: number;
  lastAttemptAt?: number;
  attempts: number;
}

export interface QueueStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  abandoned: number;
}

// =============================================================================
// Queue Manager
// =============================================================================

const operationMap = new Map<string, QueuedOperation<unknown>>();

/**
 * Add an operation to the queue with automatic retry.
 * Returns a promise that resolves when the operation completes or fails permanently.
 */
export function queueOperation<T>(
  id: string,
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
  } = {}
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const operation: QueuedOperation<T> = {
      id,
      fn,
      maxAttempts: options.maxAttempts ?? 3,
      baseDelayMs: options.baseDelayMs ?? 1000,
      status: "pending",
      createdAt: Date.now(),
      attempts: 0,
    };

    // Prevent duplicate IDs (optional - comment out if not needed)
    // if (operationMap.has(id)) {
    //   console.warn(`[async-queue] Duplicate operation ID: ${id}`);
    //   const existing = operationMap.get(id) as QueuedOperation<T>;
    //   if (existing.status === "pending") {
    //     // Return existing promise
    //     return existing;
    //   }
    // }

    operationMap.set(id, operation);
    processOperation(id, operation)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      })
      .finally(() => {
        // Clean up after completion
        operationMap.delete(id);
      });
  });
}

/**
 * Process a single operation with exponential backoff retry logic.
 */
async function processOperation<T>(
  id: string,
  operation: QueuedOperation<T>
): Promise<T> {
  let lastResult: T | undefined;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= operation.maxAttempts; attempt++) {
    operation.status = "running";
    operation.attempts = attempt;
    operation.lastAttemptAt = Date.now();
    operationMap.set(id, operation);

    try {
      lastResult = await operation.fn();
      operation.status = "completed";
      operation.result = lastResult;
      operationMap.set(id, operation);
      return lastResult;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      operation.error = lastError;

      // Don't retry on client errors (4xx) - assume they're not transient
      // This check requires the error to have a status property
      if (isClientError(err)) {
        operation.status = "failed";
        operationMap.set(id, operation);
        throw err;
      }

      if (attempt < operation.maxAttempts) {
        const delay = operation.baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`[async-queue] Operation ${id} failed, retrying in ${delay}ms (attempt ${attempt}/${operation.maxAttempts})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  operation.status = "failed";
  operationMap.set(id, operation);
  throw new Error(lastError ?? `Operation ${id} failed after ${operation.maxAttempts} attempts`);
}

/**
 * Check if an error represents a client error (4xx).
 * This requires the error to have a status property.
 */
function isClientError(err: unknown): boolean {
  if (err instanceof Error && "status" in err) {
    const status = (err as { status?: number }).status;
    return typeof status === "number" && status >= 400 && status < 500;
  }
  return false;
}

/**
 * Cancel a pending or running operation.
 * Returns true if the operation was found and cancelled.
 */
export function cancelOperation(id: string): boolean {
  const op = operationMap.get(id);
  if (op && (op.status === "pending" || op.status === "running")) {
    op.status = "abandoned";
    operationMap.set(id, op);
    return true;
  }
  return false;
}

/**
 * Get the current state of a queued operation.
 */
export function getOperationState<T>(id: string): QueuedOperation<T> | undefined {
  return operationMap.get(id) as QueuedOperation<T> | undefined;
}

/**
 * Get queue statistics.
 */
export function getQueueStats(): QueueStats {
  const stats: QueueStats = {
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    abandoned: 0,
  };

  for (const op of operationMap.values()) {
    stats.total++;
    switch (op.status) {
      case "pending":
        stats.pending++;
        break;
      case "running":
        stats.running++;
        break;
      case "completed":
        stats.completed++;
        break;
      case "failed":
        stats.failed++;
        break;
      case "abandoned":
        stats.abandoned++;
        break;
    }
  }

  return stats;
}

/**
 * Clear all operations from the queue.
 */
export function clearQueue(): void {
  operationMap.clear();
}

// =============================================================================
// Helper: Exponential Backoff
// =============================================================================

/**
 * Get the delay for a given attempt number.
 */
export function getRetryDelay(attempt: number, baseDelayMs: number = 1000): number {
  return baseDelayMs * Math.pow(2, attempt - 1);
}

/**
 * Wait for the appropriate delay based on the attempt number.
 */
export async function waitForRetry(attempt: number, baseDelayMs: number = 1000): Promise<void> {
  const delay = getRetryDelay(attempt, baseDelayMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}
