import { API_BASE } from './config'
import type { AuthData, UserRole } from '../utils/auth'

export type RegisterRole = 'parent' | 'center_admin'

export type RegisterPayload = {
  role: RegisterRole
  email: string
  phone: string
  password: string
  full_name?: string
  city?: string
  center_name?: string
  address?: string
}

export async function login(
  email: string,
  password: string,
  role: UserRole
): Promise<AuthData> {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      role,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка авторизации')
  }

  return data as AuthData
}

export async function register(payload: RegisterPayload): Promise<AuthData> {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка регистрации')
  }

  return data as AuthData
}