/**
 * API Request/Response Types
 * 
 * TypeScript interfaces for all API endpoints
 * Matches Supabase RPC function signatures
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Common Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BookingVertical = 'flight' | 'hotel' | 'visa' | 'trip';
export type BookingStatus =
  | 'draft'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'completed';

export type PaymentMethod = 'cash' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type VisaReviewStatus =
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'needs_more_info';

export type TripDifficulty = 'easy' | 'moderate' | 'challenging';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Flight Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FlightSearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string; // ISO date
  returnDate?: string; // ISO date (for round-trip)
  class?: 'economy' | 'business' | 'first';
  passengers?: number;
  tripType?: 'one-way' | 'round-trip';
}

export interface Flight {
  id: string;
  airline: string;
  flight_number: string;
  aircraft_type?: string;
  origin_iata: string;
  origin_city: string;
  destination_iata: string;
  destination_city: string;
  departure_at: string; // ISO timestamp
  arrival_at: string; // ISO timestamp
  class: 'economy' | 'business' | 'first';
  seats_available: number;
  base_price: number;
  taxes_amount: number;
  total_price: number;
  currency: 'EGP';
  baggage_kg: number;
  refundable: boolean;
}

export interface BookFlightRequest {
  flight_id: string;
  passengers: Array<{
    title: 'mr' | 'ms' | 'mrs' | 'dr';
    first_name: string;
    last_name: string;
    date_of_birth: string; // ISO date
    passport_number: string;
    passport_expiry: string; // ISO date
    nationality: string;
  }>;
  contact: {
    email: string;
    phone: string;
  };
  special_requests?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hotel Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HotelSearchParams {
  city?: string;
  checkin?: string; // ISO date
  checkout?: string; // ISO date
  guests?: number;
  rooms?: number;
  room_type?: 'standard' | 'deluxe' | 'suite';
  min_stars?: number;
  max_price?: number;
}

export interface Hotel {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  address: string;
  star_rating: number;
  images: string[];
  amenities: string[];
  description_ar: string;
  description_en: string;
  check_in_time: string;
  check_out_time: string;
  price_per_night: number;
  taxes_percent: number;
  currency: 'EGP';
  cancellation_hours: number;
  availability?: {
    room_type: string;
    rooms_left: number;
  }[];
}

export interface BookHotelRequest {
  hotel_id: string;
  checkin_date: string; // ISO date
  checkout_date: string; // ISO date
  room_type: 'standard' | 'deluxe' | 'suite';
  rooms_count: number;
  guests: Array<{
    title: 'mr' | 'ms' | 'mrs' | 'dr';
    first_name: string;
    last_name: string;
  }>;
  contact: {
    email: string;
    phone: string;
  };
  special_requests?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Visa Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface VisaSearchParams {
  destination?: string;
  visa_type?: 'tourist' | 'business' | 'student' | 'work' | 'transit';
  nationality?: string;
}

export interface Visa {
  id: string;
  destination_country: string;
  country_code: string;
  visa_type: 'tourist' | 'business' | 'student' | 'work' | 'transit';
  processing_days: number;
  price: number;
  service_fee: number;
  total_price: number;
  currency: 'EGP';
  required_documents: string[];
  optional_documents: string[];
  validity_months: number;
  max_stay_days: number;
  min_passport_validity_months: number;
  eligible_nationalities?: string[];
  notes_ar: string;
  notes_en: string;
}

export interface SubmitVisaApplicationRequest {
  visa_id: string;
  applicant: {
    title: 'mr' | 'ms' | 'mrs' | 'dr';
    first_name: string;
    last_name: string;
    date_of_birth: string; // ISO date
    passport_number: string;
    passport_expiry: string; // ISO date
    passport_issue_date: string; // ISO date
    nationality: string;
    occupation?: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  travel_dates?: {
    intended_arrival: string; // ISO date
    intended_departure: string; // ISO date
  };
  purpose_of_visit?: string;
  document_ids?: string[]; // IDs from visa_documents table
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Trip Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TripSearchParams {
  destination?: string;
  start_date_from?: string; // ISO date
  start_date_to?: string; // ISO date
  duration_days?: number;
  difficulty?: TripDifficulty;
  min_price?: number;
  max_price?: number;
}

export interface Trip {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  destination: string;
  country: string;
  duration_days: number;
  start_date: string; // ISO date
  end_date: string; // ISO date
  spots_available: number;
  group_size_max: number;
  price_per_person: number;
  currency: 'EGP';
  difficulty: TripDifficulty;
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
  }>;
  includes: string[];
  excludes: string[];
  meeting_point: string;
  meeting_time: string;
  cancellation_days: number;
  is_featured: boolean;
}

export interface BookTripRequest {
  trip_id: string;
  travelers: Array<{
    title: 'mr' | 'ms' | 'mrs' | 'dr';
    first_name: string;
    last_name: string;
    date_of_birth: string; // ISO date
    passport_number?: string;
    nationality: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }>;
  contact: {
    email: string;
    phone: string;
  };
  special_requests?: string;
  dietary_requirements?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Unified Booking Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type BookingRequest =
  | { vertical: 'flight'; data: BookFlightRequest }
  | { vertical: 'hotel'; data: BookHotelRequest }
  | { vertical: 'visa'; data: SubmitVisaApplicationRequest }
  | { vertical: 'trip'; data: BookTripRequest };

export interface BookingResponse {
  booking_id: string;
  reference: string; // SPK-FL-2026-A7X9K2
  status: BookingStatus;
  vertical: BookingVertical;
  total_amount: number;
  currency: 'EGP';
  expires_at?: string; // ISO timestamp (null for confirmed bookings)
  payment_id?: string;
  created_at: string; // ISO timestamp
}

export interface BookingDetails extends BookingResponse {
  customer_id: string;
  contact: {
    email: string;
    phone: string;
  };
  // Vertical-specific details loaded based on vertical
  flight_details?: {
    flight_id: string;
    airline: string;
    flight_number: string;
    origin: string;
    destination: string;
    departure_at: string;
    arrival_at: string;
    passengers: Array<{
      first_name: string;
      last_name: string;
      passport_number: string;
    }>;
  };
  hotel_details?: {
    hotel_id: string;
    hotel_name: string;
    city: string;
    checkin_date: string;
    checkout_date: string;
    nights: number;
    room_type: string;
    rooms_count: number;
    guests: Array<{
      first_name: string;
      last_name: string;
    }>;
  };
  visa_details?: {
    visa_id: string;
    destination_country: string;
    visa_type: string;
    applicant_name: string;
    passport_number: string;
    review_status: VisaReviewStatus;
    submitted_at?: string;
  };
  trip_details?: {
    trip_id: string;
    trip_title: string;
    destination: string;
    start_date: string;
    end_date: string;
    travelers_count: number;
    travelers: Array<{
      first_name: string;
      last_name: string;
    }>;
  };
  status_history?: Array<{
    from_status?: string;
    to_status: string;
    changed_by?: string;
    reason?: string;
    created_at: string;
  }>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Payment Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: 'EGP';
  method: PaymentMethod;
  status: PaymentStatus;
  bank_transfer_details?: {
    transfer_reference?: string;
    transfer_date?: string;
    receipt_url?: string;
    bank_name?: string;
    account_holder?: string;
  };
  created_at: string;
  confirmed_at?: string;
  confirmed_by?: string;
}

export interface ConfirmPaymentRequest {
  payment_id: string;
  bank_transfer_details?: {
    transfer_reference: string;
    transfer_date: string; // ISO date
    receipt_url?: string;
    bank_name?: string;
  };
  notes?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Cancellation Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CancelBookingRequest {
  booking_id: string;
  reason?: string;
}

export interface CancelBookingResponse {
  booking_id: string;
  status: 'cancelled';
  refund_amount: number;
  refund_percent: number;
  penalty_amount: number;
  original_amount: number;
  cancelled_at: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Visa Review Types (Staff)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ReviewVisaApplicationRequest {
  visa_booking_detail_id: string;
  decision: 'approve' | 'reject' | 'needs_more_info';
  notes?: string;
  required_documents?: string[]; // For 'needs_more_info'
}

export interface ReviewVisaApplicationResponse {
  visa_booking_detail_id: string;
  review_status: VisaReviewStatus;
  reviewed_at: string;
  reviewed_by: string;
  notes?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pagination & Filtering
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface BookingListParams extends PaginationParams {
  status?: BookingStatus;
  vertical?: BookingVertical;
  from_date?: string; // ISO date
  to_date?: string; // ISO date
}
