import { z } from "zod";

// ─── Flight Offer Schema ──────────────────────────────────────────────────────
export const FlightSchema = z.object({
  id: z.string().uuid().optional(),
  airline: z.string().min(1, "Airline is required"),
  flight_number: z.string().min(1, "Flight number is required"),
  origin_iata: z.string().min(3).max(3).uppercase(),
  destination_iata: z.string().min(3).max(3).uppercase(),
  departure_at: z.string().datetime(),
  arrival_at: z.string().datetime(),
  class: z.enum(["economy", "business", "first"]),
  seats_total: z.number().int().min(1),
  seats_available: z.number().int().min(0),
  base_price: z.number().min(0),
  currency: z.string().min(3).max(3).uppercase(),
  baggage_kg: z.number().int().min(0),
  refundable: z.boolean(),
  is_public: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ─── Flight Booking Schema ────────────────────────────────────────────────────
export const PassengerSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  passport_number: z.string().min(6, "Passport number must be at least 6 characters"),
  nationality: z.string().min(2, "Nationality is required"),
  date_of_birth: z.string().datetime(),
});

export const FlightBookingSchema = z.object({
  flight_id: z.string().uuid("Invalid flight ID"),
  customer_id: z.string().uuid("Invalid customer ID"),
  passengers: z.array(PassengerSchema).min(1, "At least one passenger is required"),
  pnr_code: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "refunded"]).default("pending"),
  total_amount: z.number().min(0),
  payment_id: z.string().uuid("Invalid payment ID"),
  created_at: z.string().datetime().optional(),
});

// ─── Flight Search Query Schema ───────────────────────────────────────────────
export const FlightSearchQuerySchema = z.object({
  origin: z.string().min(3).max(3).uppercase().optional(),
  destination: z.string().min(3).max(3).uppercase().optional(),
  departure_date_start: z.string().datetime().optional(),
  departure_date_end: z.string().datetime().optional(),
  class: z.enum(["economy", "business", "first"]).optional(),
  airline: z.string().optional(),
  max_price: z.number().min(0).optional(),
  refundable: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// ─── Flight Create/Update Schema ──────────────────────────────────────────────
export const FlightCreateSchema = FlightSchema.omit({ id: true, created_at: true, updated_at: true });
export const FlightUpdateSchema = FlightSchema.partial().omit({ id: true, created_at: true });

// ─── Types ────────────────────────────────────────────────────────────────────
export type Flight = z.infer<typeof FlightSchema>;
export type FlightBooking = z.infer<typeof FlightBookingSchema>;
export type Passenger = z.infer<typeof PassengerSchema>;
export type FlightSearchQuery = z.infer<typeof FlightSearchQuerySchema>;
export type FlightCreate = z.infer<typeof FlightCreateSchema>;
export type FlightUpdate = z.infer<typeof FlightUpdateSchema>;
