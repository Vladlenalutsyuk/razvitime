//D:\Data USER\Desktop\razvitime\client\src\utils\auth.ts
export type UserRole = 'parent' | 'center_admin'

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
  }
}

export function getAuth(): AuthData | null {
  const raw = localStorage.getItem('razvitime_auth')

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem('razvitime_auth')
}