/**
 * operation-queue.ts
 * Async queue for operations with retry and backoff.
 * Single responsibility: queue state management only.
 */

import { type ServiceResult } from "./api-client";

export interface QueuedOperation<T> {
  id: string;
  fn: () => Promise<ServiceResult<T>>;
  maxAttempts: number;
  baseDelayMs: number;
  status: "pending" | "running" | "completed" | "failed" | "abandoned";
  result?: ServiceResult<T>;
  createdAt: number;
  lastAttemptAt?: number;
}

const operationQueue = new Map<string, QueuedOperation<unknown>>();

async function processQueueItem<T>(
  id: string,
  operation: QueuedOperation<T>
): Promise<ServiceResult<T>> {
  let lastResult: ServiceResult<T> = { ok: false, error: "Not attempted" };

  for (let attempt = 1; attempt <= operation.maxAttempts; attempt++) {
    operation.status = "running";
    operation.lastAttemptAt = Date.now();
    operationQueue.set(id, operation);

    lastResult = await operation.fn();

    if (lastResult.ok) {
      operation.status = "completed";
      operation.result = lastResult;
      operationQueue.set(id, operation);
      return lastResult;
    }

    if (lastResult.status && lastResult.status >= 400 && lastResult.status < 500) {
      operation.status = "failed";
      operation.result = lastResult;
      operationQueue.set(id, operation);
      return lastResult;
    }

    if (attempt < operation.maxAttempts) {
      const delay = operation.baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  operation.status = "failed";
  operation.result = lastResult;
  operationQueue.set(id, operation);
  return lastResult;
}

export function queueOperation<T>(
  id: string,
  fn: () => Promise<ServiceResult<T>>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<ServiceResult<T>> {
  return new Promise<ServiceResult<T>>((resolve) => {
    const operation: QueuedOperation<T> = {
      id,
      fn,
      maxAttempts: options.maxAttempts ?? 3,
      baseDelayMs: options.baseDelayMs ?? 1000,
      status: "pending",
      createdAt: Date.now(),
    };

    operationQueue.set(id, operation);
    processQueueItem(id, operation).then((result) => {
      resolve(result);
      operationQueue.delete(id);
    });
  });
}

export function cancelOperation(id: string): boolean {
  const op = operationQueue.get(id);
  if (op && (op.status === "pending" || op.status === "running")) {
    op.status = "abandoned";
    operationQueue.set(id, op);
    return true;
  }
  return false;
}

export function getOperationState<T>(id: string): QueuedOperation<T> | undefined {
  return operationQueue.get(id) as QueuedOperation<T> | undefined;
}
