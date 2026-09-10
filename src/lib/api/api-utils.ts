export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export function saveSession(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token)
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token")
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token")
  }
  return null
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`/api/v1${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}