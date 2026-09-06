/**
 * /src/modules/travel — public barrel
 * =====================================
 * Travel requests, documents, and realtime subscriptions.
 */

// Service (ServiceResult pattern — preferred over legacy ApiResponse)
export {
  travelRequestsService,
  documentRequirementsService,
  customerDocumentsService,
  toApiResponse,
}                                           from "./services/travel-requests-service";
export type { ServiceResult }               from "./services/travel-requests-service";

// Legacy API (ApiResponse pattern — kept for backward-compat)
export {
  travelRequestsApi,
  documentRequirementsApi,
  documentsApi,
  realtimeApi,
  crmApi,
}                                           from "./services/travel-endpoints";

// Store
export { useTravelRequestsStore }           from "./store/travelStore";
