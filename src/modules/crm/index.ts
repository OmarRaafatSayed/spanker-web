/**
 * /src/modules/crm — public barrel
 * ==================================
 * Central CRM integration layer. All FastAPI calls originate from crmAdapter.
 */

// Main adapter (the key integration point)
export { crmAdapter, queueOperation }               from "./services/crm-adapter";
export type { CrmAdapter, ServiceResult }           from "./services/crm-adapter";

// Event system
export { registrationEventDispatcher }              from "./services/registration-event-dispatcher";
export type {
  UserRegisteredEvent,
  EventDispatchResult,
}                                                   from "./services/registration-event-dispatcher";

// Queue utilities
export { cancelOperation, getOperationState }       from "./services/operation-queue";

// Sync processor (server-side, used in API routes)
export * from "./services/sync-queue-processor";
