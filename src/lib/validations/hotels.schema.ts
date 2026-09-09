import { z } from "zod";

// ─── Hotel Schema ─────────────────────────────────────────────────────────────
export const HotelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Hotel name is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  address: z.string().optional(),
  star_rating: z.number().int().min(1).max(5),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  images: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  rooms_total: z.number().int().min(0),
  rooms_available: z.number().int().min(0),
  price_per_night: z.number().min(0),
  currency: z.string().min(3).max(3).uppercase(),
  is_public: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ─── Hotel Booking Schema ─────────────────────────────────────────────────────
export const HotelBookingSchema = z.object({
  hotel_id: z.string().uuid("Invalid hotel ID"),
  customer_id: z.string().uuid("Invalid customer ID"),
  room_type: z.string().min(1, "Room type is required"),
  check_in: z.string().datetime(),
  check_out: z.string().datetime(),
  nights: z.number().int().min(1).optional(),
  guests: z.number().int().min(1),
  rooms: z.number().int().min(1),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending"),
  total_amount: z.number().min(0),
  payment_id: z.string().uuid("Invalid payment ID"),
  created_at: z.string().datetime().optional(),
});

// ─── Hotel Search Query Schema ────────────────────────────────────────────────
export const HotelSearchQuerySchema = z.object({
  city: z.string().optional(),
  check_in: z.string().datetime().optional(),
  check_out: z.string().datetime().optional(),
  guests: z.number().int().min(1).optional(),
  rooms: z.number().int().min(1).optional(),
  star_rating: z.number().int().min(1).max(5).optional(),
  amenities: z.array(z.string()).optional(),
  max_price: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// ─── Hotel Create/Update Schema ───────────────────────────────────────────────
export const HotelCreateSchema = HotelSchema.omit({ id: true, created_at: true, updated_at: true });
export const HotelUpdateSchema = HotelSchema.partial().omit({ id: true, created_at: true });

// ─── Types ────────────────────────────────────────────────────────────────────
export type Hotel = z.infer<typeof HotelSchema>;
export type HotelBooking = z.infer<typeof HotelBookingSchema>;
export type HotelSearchQuery = z.infer<typeof HotelSearchQuerySchema>;
export type HotelCreate = z.infer<typeof HotelCreateSchema>;
export type HotelUpdate = z.infer<typeof HotelUpdateSchema>;

// ─── Validation helpers ───────────────────────────────────────────────────────
export const validateHotelDates = (checkIn: string, checkOut: string) => {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (checkOutDate <= checkInDate) {
    return { valid: false, error: "Check-out must be after check-in" };
  }
  if (checkInDate < new Date(new Date().toDateString())) {
    return { valid: false, error: "Check-in must be in the future" };
  }
  return { valid: true };
};
