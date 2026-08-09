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
  session?: AuthSession;
  error?: string;
  detail?: string;
}
