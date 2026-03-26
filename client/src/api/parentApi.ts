import { API_BASE } from './config'

export type ParentProfile = {
  id?: number
  user_id?: number
  full_name?: string
  city: string
  telegram: string
  whatsapp: string
  email: string
  avatar_url: string
  preferred_contact?: string | null
  notifications_enabled?: boolean
}

export async function getParentProfile(userId: number): Promise<ParentProfile> {
  const response = await fetch(`${API_BASE}/api/parent/profile?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки профиля')
  }

  return data
}

export async function updateParentProfile(params: {
  userId: number
  city: string
  telegram: string
  whatsapp: string
  email: string
  avatar_url: string
}): Promise<ParentProfile> {
  const response = await fetch(`${API_BASE}/api/parent/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка сохранения профиля')
  }

  return data
}