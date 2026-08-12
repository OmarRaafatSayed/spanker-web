/**
 * token-resolver.ts
 * Resolution of valid Bearer tokens from session storage.
 * Single responsibility: token extraction and validation only.
 */

const SESSION_KEYS = [
  "customer_portal_session",
  "travel_crm_sb_session",
] as const;

interface StoredSession {
  session?: {
    access_token?: string;
    expires_at?: number;
  };
  user?: { id: string; email: string };
}

export function resolveToken(): string | null {
  if (typeof window === "undefined") return null;

  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const key of SESSION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw) as StoredSession;
      const token = parsed?.session?.access_token;
      const expiresAt = parsed?.session?.expires_at;

      if (!token) continue;

      if (expiresAt && expiresAt - 60 <= nowSeconds) {
        console.warn(`[token-resolver] Token in "${key}" is expired. Skipping.`);
        continue;
      }

      return token;
    } catch {
      // Corrupt JSON — skip silently
    }
  }

  return null;
}
