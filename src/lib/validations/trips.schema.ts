import { z } from "zod";

// ─── Trip Package Schema ──────────────────────────────────────────────────────
export const TripSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/),
  destination: z.string().min(1, "Destination is required"),
  country: z.string().min(1, "Country is required"),
  duration_days: z.number().int().min(1),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  group_size_max: z.number().int().min(1),
  spots_available: z.number().int().min(0),
  itinerary: z.array(z.object({
    day: z.number().int().min(1),
    title: z.string().min(1),
    description: z.string(),
    meals: z.array(z.string()).default([]),
    locations: z.array(z.string()).default([]),
  })),
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([]),
  price_per_person: z.number().min(0),
  currency: z.string().min(3).max(3).uppercase(),
  cover_image: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  difficulty: z.enum(["easy", "moderate", "challenging"]),
  is_featured: z.boolean().default(false),
  is_public: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ─── Trip Booking Schema ──────────────────────────────────────────────────────
export const TripBookingSchema = z.object({
  trip_id: z.string().uuid("Invalid trip ID"),
  customer_id: z.string().uuid("Invalid customer ID"),
  travelers: z.number().int().min(1),
  lead_traveler: z.object({
    full_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(8),
  }),
  special_requests: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).default("pending"),
  total_amount: z.number().min(0),
  payment_id: z.string().uuid("Invalid payment ID"),
  created_at: z.string().datetime().optional(),
});

// ─── Trip Search Query Schema ─────────────────────────────────────────────────
export const TripSearchQuerySchema = z.object({
  destination: z.string().optional(),
  duration_days_min: z.number().int().min(1).optional(),
  duration_days_max: z.number().int().min(1).optional(),
  start_date_start: z.string().datetime().optional(),
  start_date_end: z.string().datetime().optional(),
  difficulty: z.enum(["easy", "moderate", "challenging"]).optional(),
  max_price: z.number().min(0).optional(),
  featured_only: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// ─── Trip Create/Update Schema ────────────────────────────────────────────────
export const TripCreateSchema = TripSchema.omit({ id: true, created_at: true, updated_at: true });
export const TripUpdateSchema = TripSchema.partial().omit({ id: true, created_at: true });

// ─── Types ────────────────────────────────────────────────────────────────────
export type Trip = z.infer<typeof TripSchema>;
export type TripBooking = z.infer<typeof TripBookingSchema>;
export type TripSearchQuery = z.infer<typeof TripSearchQuerySchema>;
export type TripCreate = z.infer<typeof TripCreateSchema>;
export type TripUpdate = z.infer<typeof TripUpdateSchema>;
export type ItineraryItem = z.infer<typeof TripSchema>["itinerary"][number];
