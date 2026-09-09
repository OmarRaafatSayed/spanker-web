import { z } from "zod";

// ─── Payment Schema ───────────────────────────────────────────────────────────
export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  reference: z.string().min(1, "Reference is required"),
  method: z.enum(["card", "wallet", "bank_transfer", "cash"]),
  amount: z.number().min(0),
  currency: z.string().min(3).max(3).uppercase(),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  provider_ref: z.string().optional(),
  paid_at: z.string().datetime().optional(),
  created_at: z.string().datetime().optional(),
});

// ─── Payment Create Schema ────────────────────────────────────────────────────
export const PaymentCreateSchema = PaymentSchema.omit({ id: true, created_at: true, paid_at: true });

// ─── Types ────────────────────────────────────────────────────────────────────
export type Payment = z.infer<typeof PaymentSchema>;
export type PaymentCreate = z.infer<typeof PaymentCreateSchema>;
