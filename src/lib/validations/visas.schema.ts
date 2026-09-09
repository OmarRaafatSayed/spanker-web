import { z } from "zod";

// ─── Visa Type Schema ─────────────────────────────────────────────────────────
export const VisaSchema = z.object({
  id: z.string().uuid().optional(),
  destination_country: z.string().min(1, "Destination country is required"),
  visa_type: z.enum(["tourist", "business", "student", "transit", "work"]),
  processing_days: z.number().int().min(1),
  price: z.number().min(0),
  currency: z.string().min(3).max(3).uppercase(),
  required_documents: z.array(z.object({
    label: z.string().min(1),
    required: z.boolean(),
    accepted_formats: z.array(z.string()),
  })).default([]),
  validity_months: z.number().int().min(1).optional(),
  max_stay_days: z.number().int().min(1),
  notes: z.string().optional(),
  is_public: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ─── Visa Application Schema ──────────────────────────────────────────────────
export const VisaApplicationSchema = z.object({
  id: z.string().uuid().optional(),
  visa_id: z.string().uuid("Invalid visa ID"),
  customer_id: z.string().uuid("Invalid customer ID"),
  traveler_full_name: z.string().min(1, "Full name is required"),
  passport_number: z.string().min(6, "Passport number must be at least 6 characters"),
  passport_expiry: z.string().datetime(),
  nationality: z.string().min(1, "Nationality is required"),
  purpose_of_travel: z.enum(["tourism", "business", "study", "family", "other"]).default("tourism"),
  intended_travel_date: z.string().datetime(),
  documents_uploaded: z.array(z.object({
    label: z.string(),
    url: z.string(),
    uploaded_at: z.string().datetime(),
  })).default([]),
  status: z.enum(["draft", "submitted", "under_review", "approved", "rejected", "needs_more_info"]).default("draft"),
  review_notes: z.string().optional(),
  submitted_at: z.string().datetime().optional(),
  decided_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// ─── Visa Search Query Schema ─────────────────────────────────────────────────
export const VisaSearchQuerySchema = z.object({
  destination_country: z.string().optional(),
  visa_type: z.enum(["tourist", "business", "student", "transit", "work"]).optional(),
  processing_days_max: z.number().int().min(1).optional(),
  nationality: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
});

// ─── Visa Create/Update Schema ────────────────────────────────────────────────
export const VisaCreateSchema = VisaSchema.omit({ id: true, created_at: true, updated_at: true });
export const VisaUpdateSchema = VisaSchema.partial().omit({ id: true, created_at: true });

// ─── Visa Application Create Schema ───────────────────────────────────────────
export const VisaApplicationCreateSchema = z.object({
  visa_id: z.string().uuid("Invalid visa ID"),
  customer_id: z.string().uuid("Invalid customer ID"),
  traveler_full_name: z.string().min(1, "Full name is required"),
  passport_number: z.string().min(6, "Passport number must be at least 6 characters"),
  passport_expiry: z.string().datetime(),
  nationality: z.string().min(1, "Nationality is required"),
  purpose_of_travel: z.enum(["tourism", "business", "study", "family", "other"]).default("tourism"),
  intended_travel_date: z.string().datetime(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type Visa = z.infer<typeof VisaSchema>;
export type VisaApplication = z.infer<typeof VisaApplicationSchema>;
export type VisaSearchQuery = z.infer<typeof VisaSearchQuerySchema>;
export type VisaCreate = z.infer<typeof VisaCreateSchema>;
export type VisaUpdate = z.infer<typeof VisaUpdateSchema>;
export type VisaApplicationCreate = z.infer<typeof VisaApplicationCreateSchema>;
