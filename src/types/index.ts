// =============================================================================
// Core Types - Travel Platform Admin & Client Portal
// =============================================================================

// User Types
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  role: 'admin' | 'staff' | 'customer';
  created_at: string;
  updated_at: string;
}

// Travel Request Types
export type TravelType = 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package';

export type RequestStatus = 
  | 'pending_documents' 
  | 'documents_review' 
  | 'docs_approved' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface TravelRequest {
  id: string;
  client_user_id: string;
  destination_country: string;
  travel_type: TravelType;
  departure_date?: string;
  return_date?: string;
  traveler_count: number;
  status: RequestStatus;
  document_checklist: DocumentChecklist;
  documents_completion_percent: number;
  customer_notes?: string;
  staff_notes?: string;
  next_action_required?: string;
  next_follow_up_date?: string;
  linked_visa_application_id?: string;
  linked_payment_id?: string;
  assigned_staff_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface DocumentChecklist {
  required: DocumentItem[];
  optional: DocumentItem[];
}

export interface DocumentItem {
  type: string;
  name: string;
  status: 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected';
  uploaded_at?: string;
  rejection_reason?: string;
}

// Document Requirements
export interface DocumentRequirement {
  id: string;
  destination_country: string;
  travel_type: TravelType;
  required_documents: string[];
  optional_documents: string[];
  special_instructions?: string;
  processing_time_days: number;
  created_at: string;
  updated_at: string;
}

// Customer Documents
export type DocumentStatus = 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface CustomerDocument {
  id: string;
  travel_request_id: string;
  client_user_id: string;
  document_type: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: DocumentStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

// Communications
export type CommunicationType = 'email' | 'whatsapp' | 'sms' | 'phone_call' | 'system_notification';

export interface CustomerCommunication {
  id: string;
  travel_request_id: string;
  client_user_id: string;
  staff_user_id?: string;
  communication_type: CommunicationType;
  subject?: string;
  message: string;
  sent_at: string;
  whatsapp_message_id?: string;
  email_message_id?: string;
  created_at: string;
}

// Admin CMS Types
export interface TripPackage {
  id: string;
  title: string;
  description: string;
  destination: string;
  price: number;
  currency: string;
  duration: number; // days
  images: string[];
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ContentBanner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: 'hero' | 'secondary' | 'footer';
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

// Analytics Types
export interface AnalyticsData {
  total_website_visits: number;
  pending_leads: number;
  active_trip_listings: number;
  completed_requests: number;
  revenue_this_month: number;
}

// CRM Integration Types
export interface CRMStatusUpdate {
  tracking_id: string;
  status: RequestStatus;
  message: string;
  timestamp: string;
  staff_id?: string;
  document_updates?: {
    type: string;
    status: DocumentStatus;
  }[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Form Types
export interface TravelRequestForm {
  destination_country: string;
  travel_type: TravelType;
  departure_date?: string;
  return_date?: string;
  traveler_count: number;
  customer_notes?: string;
}

export interface DocumentUploadForm {
  document_type: string;
  file: File;
}

export interface AdminTripPackageForm {
  title: string;
  description: string;
  destination: string;
  price: number;
  currency: string;
  duration: number;
  images: string[];
  features: string[];
  is_active: boolean;
}

export interface AdminBannerForm {
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  position: 'hero' | 'secondary' | 'footer';
  display_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

// =============================================================================
// Phase 1 Types — Visa Types, Hotels, Offers, Visa Document Requirements
// =============================================================================

export type VisaCategory = "vip" | "standard" | "urgent" | "multi_entry" | "extension";
export type ProfessionTier = "high" | "medium" | "weak" | "none";

export interface VisaType {
  id: string;
  country_code: string;
  country_name: string;
  visa_name: string;
  duration_days: number;
  category: VisaCategory;
  profession_tier: ProfessionTier | null;
  price: number;
  deposit_amount: number;
  child_price: number | null;
  processing_days: number;
  is_urgent_available: boolean;
  urgent_price: number | null;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BoardType = "room_only" | "bed_breakfast" | "half_board" | "full_board";

export interface HotelRoom {
  id: string;
  hotel_id: string;
  room_type: string;
  board_type: BoardType;
  price_per_night: number;
  currency: string;
  max_occupancy: number;
  description: string | null;
  images: string[];
  is_available: boolean;
  created_at: string;
}

export interface Hotel {
  id: string;
  name: string;
  stars: number | null;
  country: string;
  city: string;
  address: string | null;
  google_maps_url: string | null;
  amenities: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  cancellation_policy: string | null;
  booking_conditions: string | null;
  is_active: boolean;
  cover_image: string | null;
  images: string[];
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  hotel_rooms?: HotelRoom[];
}

export type OfferType = "flight" | "hotel" | "visa" | "package";

export interface Offer {
  id: string;
  title: string;
  offer_type: OfferType;
  destination: string;
  original_price: number | null;
  discounted_price: number;
  discount_percent: number | null;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  terms_and_conditions: string | null;
  images: string[];
  available_slots: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisaDocumentRequirement {
  id: string;
  country_code: string;
  visa_type_id: string | null;
  document_key: string;
  document_label: string;
  is_required: boolean;
  conditions: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  visa_types?: Pick<VisaType, "id" | "visa_name" | "country_name"> | null;
}

// Form types for admin panels
export interface VisaTypeForm {
  country_code: string;
  country_name: string;
  visa_name: string;
  duration_days: number;
  category: VisaCategory;
  profession_tier?: ProfessionTier;
  price: number;
  deposit_amount?: number;
  child_price?: number;
  processing_days: number;
  is_urgent_available: boolean;
  urgent_price?: number;
  is_active: boolean;
  notes?: string;
}

export interface HotelForm {
  name: string;
  stars?: number;
  country: string;
  city: string;
  address?: string;
  google_maps_url?: string;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  booking_conditions?: string;
  is_active: boolean;
  cover_image?: string;
  images?: string[];
  description?: string;
}

export interface HotelRoomForm {
  room_type: string;
  board_type: BoardType;
  price_per_night: number;
  currency?: string;
  max_occupancy?: number;
  description?: string;
  images?: string[];
  is_available?: boolean;
}

export interface OfferForm {
  title: string;
  offer_type: OfferType;
  destination: string;
  original_price?: number;
  discounted_price: number;
  discount_percent?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  terms_and_conditions?: string;
  images?: string[];
  available_slots?: number;
  is_active: boolean;
}
