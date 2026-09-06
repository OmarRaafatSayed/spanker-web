/**
 * /src/modules/auth — public barrel
 * ===================================
 * Import everything auth-related from here.
 *
 * IMPORTANT: useAuth is the original context hook (used by existing CRM/admin pages).
 *            usePortalAuth is the new portal-specific hook (used by new portal pages).
 */

// ── Original exports (do NOT change — used by existing admin/CRM code) ────────
export { SessionGuard }                     from "./session-guard"
export { useAuthSession }                   from "./use-auth-session"
export { AuthProvider, useAuth }            from "./auth-context"
export { AuthModalService }                 from "./auth-modal-service"
export type { AuthResponse, LoginModalState, AuthServiceProps } from "./auth-modal-service"
export { useRegistrationEvents }            from "./hooks/useRegistrationEvents"
export { login, signup }                    from "./services/auth-endpoints"
export { unifiedSignup, getRegistrationEventStatus, isUserSyncedToCrm } from "./auth-integration"
export { useAuthStore }                     from "./store/authStore"

// ── New portal-specific auth exports ─────────────────────────────────────────
export { useAuth as usePortalAuth }         from "./hooks/useAuth"
export { useSession }                       from "./hooks/useSession"
export { authService }                      from "./services/authService"
export { LoginForm }                        from "./components/LoginForm"
export { RegisterForm }                     from "./components/RegisterForm"
export type { AuthUser, LoginCredentials, RegisterCredentials, AuthSession, AuthResult } from "./types/auth.types"
