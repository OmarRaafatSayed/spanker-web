import type { AuthResponse } from "@/types/flights";
import { apiFetch, saveSession } from "./api-utils";

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.success && res.session && res.user) {
      saveSession(res);
    }
    return res;
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    return {
      success: false,
      error: (e?.detail as string) ?? (e?.message as string) ?? "Login failed",
    };
  }
}

export async function signup(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  role = "customer"
): Promise<AuthResponse> {
  try {
    const res = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
      }),
    });
    if (res.success && res.session && res.user) {
      saveSession(res, { first_name: firstName, last_name: lastName, phone });
    }
    return res;
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    return {
      success: false,
      error: (e?.detail as string) ?? (e?.message as string) ?? "Signup failed",
    };
  }
}
