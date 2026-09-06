// =============================================================================
// /src/modules/portal — public barrel
// =============================================================================

// Components
export { RequestCard }      from "./components/RequestCard"
export { RequestForm }      from "./components/RequestForm"
export { RequestTimeline }  from "./components/RequestTimeline"
export { DocumentCard }     from "./components/DocumentCard"
export { DocumentUploader } from "./components/DocumentUploader"
export { NotificationBell } from "./components/NotificationBell"

// Types
export type {
  RequestType, RequestStatus, DocType, DocStatus, NotifType,
  ProfileSetupRequest, ProfileResponse,
  CreateRequestBody, RequestResponse, StatusLogEntry, RequestDetailResponse,
  RegisterDocumentBody, DocumentResponse,
  NotificationResponse, DashboardResponse,
} from "./types/portal.types"

// Hooks
export { usePortalDashboard }  from "./hooks/usePortalDashboard"
export { useRequests, useRequest } from "./hooks/useRequests"
export { useDocuments }         from "./hooks/useDocuments"
export { useNotifications }     from "./hooks/useNotifications"

// Realtime
export { usePortalRealtime }    from "./realtime/usePortalRealtime"

// Service
export { portalService }        from "./services/portalService"
