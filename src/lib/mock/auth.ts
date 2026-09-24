/**
 * ============================================================
 * MOCK AUTH STORE — Frontend-only mode
 * ============================================================
 * Replaces all supabase.auth.* calls.
 * The user is always "logged in" as the demo user.
 * signIn / signUp do a simple localStorage persist so the
 * session survives a page refresh.
 * ============================================================
 */

"use client";

import { MOCK_USER } from "./data";

const SESSION_KEY = "mock_auth_session";

export interface MockUser {
  id: string;
  email: string;
}

/** Always returns the mock user — never null. */
export function getMockUser(): MockUser {
  return { id: MOCK_USER.id, email: MOCK_USER.email };
}

/** Simulates supabase.auth.getUser() */
export async function mockGetUser(): Promise<{ data: { user: MockUser }; error: null }> {
  return { data: { user: getMockUser() }, error: null };
}

/** Simulates supabase.auth.getSession() */
export async function mockGetSession(): Promise<{
  data: { session: { user: MockUser; access_token: string } };
  error: null;
}> {
  return {
    data: {
      session: {
        user: getMockUser(),
        access_token: "mock-access-token",
      },
    },
    error: null,
  };
}

/** Simulates supabase.auth.signInWithPassword() — always succeeds */
export async function mockSignIn(
  _email: string,
  _password: string
): Promise<{ data: { user: MockUser }; error: null }> {
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(getMockUser()));
  }
  return { data: { user: getMockUser() }, error: null };
}

/** Simulates supabase.auth.signUp() — always succeeds */
export async function mockSignUp(
  email: string,
  _password: string
): Promise<{ data: { user: MockUser }; error: null }> {
  const user = { id: MOCK_USER.id, email };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return { data: { user }, error: null };
}

/** Simulates supabase.auth.signOut() */
export async function mockSignOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

/** Simulates supabase.auth.onAuthStateChange() — fires once with SIGNED_IN */
export function mockOnAuthStateChange(
  callback: (event: string, session: { user: MockUser } | null) => void
): { data: { subscription: { unsubscribe: () => void } } } {
  // Fire once asynchronously so it doesn't block render
  const timer = setTimeout(() => {
    callback("SIGNED_IN", { user: getMockUser() });
  }, 0);

  return {
    data: {
      subscription: {
        unsubscribe: () => clearTimeout(timer),
      },
    },
  };
}
