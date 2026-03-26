import { API_BASE } from './config'
import type { AuthData, UserRole } from '../utils/auth'

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