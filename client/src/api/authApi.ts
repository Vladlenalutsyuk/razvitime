import { API_BASE } from './config'

export async function login(
  email: string,
  password: string,
  role: 'parent' | 'center_admin'
) {
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

  return data
}