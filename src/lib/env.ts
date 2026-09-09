import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")
    .min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),

  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  CRM_WEBHOOK_SECRET: z
    .string()
    .min(8, "CRM_WEBHOOK_SECRET must be at least 8 chars")
    .optional(),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function validateEnv() {
  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.errors
      .map((e) => `  ✗ ${e.path.join(".")}: ${e.message}`)
      .join("\n");

    throw new Error(
      `\n\n❌ Invalid environment variables:\n${missing}\n\n` +
        `Copy .env.local.example to .env.local and fill in all required values.\n`
    );
  }

  return parsed.data;
}

export const env = validateEnv();

export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
