// =============================================================================
// Portal Types — Customer-facing portal types
// =============================================================================

export type RequestType   = "visa" | "flight" | "hotel" | "package"
export type RequestStatus = "new" | "in_review" | "quoted" | "booked" | "completed" | "cancelled"
export type DocType       =
  | "PASSPORT"
  | "NATIONAL_ID"
  | "PHOTO"
  | "BANK_STATEMENT"
  | "SALARY_SLIP"
  | "HOTEL_BOOKING"
  | "FLIGHT_BOOKING"
  | "TRAVEL_INSURANCE"
  | "OTHER"
export type DocStatus     = "uploaded" | "under_review" | "approved" | "rejected" | "expired"
export type NotifType     =
  | "status_update"
  | "document_approved"
  | "document_rejected"
  | "payment_due"
  | "payment_confirmed"
  | "message"
  | "info"

export interface ProfileSetupRequest {
  first_name: string
  last_name: string
  phone?: string
}

export interface ProfileResponse {
  id: string
  user_id: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
  created_at?: string
  updated_at?: string
}

export interface CreateRequestBody {
  full_name: string
  request_type: RequestType
  destination: string
  travel_date?: string
  return_date?: string
  num_travelers?: number
  phone?: string
  notes?: string
}

export interface RequestResponse {
  id: string
  customer_id: string
  full_name: string
  phone?: string
  email?: string
  request_type: RequestType
  destination: string
  travel_date?: string
  return_date?: string
  num_travelers: number
  notes?: string
  status: RequestStatus
  visa_application_id?: string
  created_at: string
  updated_at: string
}

export interface StatusLogEntry {
  id: string
  request_id: string
  customer_id: string
  from_status?: string
  to_status: string
  note?: string
  created_at: string
}

export interface RequestDetailResponse extends RequestResponse {
  documents: DocumentResponse[]
  status_log: StatusLogEntry[]
}

export interface RegisterDocumentBody {
  doc_type: DocType
  file_url: string
  file_name: string
  file_size?: number
  mime_type?: string
}

export interface DocumentResponse {
  id: string
  customer_id: string
  request_id?: string
  doc_type: DocType
  file_url: string
  file_name: string
  file_size?: number
  mime_type?: string
  status: DocStatus
  staff_notes?: string
  created_at: string
}

export interface NotificationResponse {
  id: string
  customer_id: string
  title: string
  body?: string
  type: NotifType
  is_read: boolean
  data?: Record<string, unknown>
  created_at: string
}

export interface DashboardResponse {
  total_requests: number
  active_requests: number
  completed_requests: number
  total_documents: number
  pending_documents: number
  approved_documents: number
  rejected_documents: number
  unread_notifications: number
  latest_requests: Partial<RequestResponse>[]
}
