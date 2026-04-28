export type UserRole = 'parent' | 'center_admin' | 'admin'

export type AuthData = {
  token: string
  user: {
    user_id?: number
    id?: number
    role: UserRole
    parent_id?: number | null
    parent_name?: string | null
    center_id?: number | null
    center_name?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
    profile?: unknown
  }
}

export function getAuth(): AuthData | null {
  const raw = localStorage.getItem('razvitime_auth')

  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem('razvitime_auth')
}