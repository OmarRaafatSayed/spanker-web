// =============================================================================
// Auth Types — Portal-specific auth types
// =============================================================================

export interface AuthUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  first_name: string
  last_name: string
  phone?: string
}

export interface AuthSession {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

export interface AuthResult {
  user: AuthUser
  session: AuthSession
}
