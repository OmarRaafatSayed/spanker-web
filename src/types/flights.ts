// Flight API types — matches the actual FastAPI backend response format

export type TravelClass =
  | "economy"
  | "premium_economy"
  | "business"
  | "first";

export interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;   // YYYY-MM-DD
  return_date?: string;     // YYYY-MM-DD — omit for one-way
  passenger_count: number;
  travel_class: TravelClass;
}

// Backend mock/real flight object
export interface FlightOffer {
  flight_id: string;
  airline: string;
  flight_number: string;
  departure_time: string;   // ISO datetime
  arrival_time: string;     // ISO datetime
  duration: string;         // "3h 30m"
  price: number;
  price_currency: string;
  stops: number;
  raw_text?: string;
}

export interface FlightSearchResponse {
  success: boolean;
  provider?: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string | null;
  flights?: FlightOffer[];
  total_results?: number;
  cached?: boolean;
  timestamp?: string;
  requested_by?: string;
  // error shape
  error?: string;
  detail?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
}

export interface AuthResponse {
  success: boolean;
  user?: { id: string; email: string };
  session?: AuthSession | null;
  error?: string;
  detail?: string;
  email_confirmation_required?: boolean;
  message?: string;
}

// ─── Customer Portal Types ────────────────────────────────────────────────────

export interface CustomerProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "customer" | "staff" | "admin";
  created_at?: string;
  updated_at?: string;
}

export type VisaStatus =
  | "documents_collected"
  | "in_review"
  | "embassy_appointment"
  | "submitted_to_consulate"
  | "approved"
  | "rejected"
  | "cancelled";

export interface VisaApplication {
  id: string;
  client_user_id: string | null;
  created_by: string;
  client_name: string;
  passport_number: string;
  destination_country: string;
  status: VisaStatus;
  appointment_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VisaApplicationsResponse {
  results: VisaApplication[];
  count: number;
}

export type PaymentStatus = "pending" | "partial" | "full" | "refunded" | "cancelled";
export type PaymentMethod = "cash" | "bank_transfer" | "pos" | "cheque";

export interface PaymentRecord {
  id: string;
  client_user_id: string | null;
  created_by: string;
  client_name: string;
  amount: number;
  currency?: string;
  method: PaymentMethod;
  status: PaymentStatus;
  booking_reference?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface PaymentsResponse {
  results: PaymentRecord[];
  count: number;
  total_amount: number;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
}
