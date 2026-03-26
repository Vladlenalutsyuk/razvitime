import { API_BASE } from './config'

export type CenterProfile = {
  id: number
  user_id: number
  name: string
  short_description: string | null
  full_description: string | null
  city: string
  address: string
  landmark: string | null
  phone: string | null
  email: string | null
  website: string | null
  telegram: string | null
  whatsapp: string | null
  vk: string | null
  logo_url: string | null
  photo_url: string | null
  is_active: number
  moderation_status: 'draft' | 'pending' | 'approved' | 'rejected'
}

export type CenterDashboardResponse = {
  center: {
    id: number
    name: string
  }
  stats: {
    activitiesCount: number
    enrollmentsCount: number
  }
  subscription: {
    status: 'active' | 'expired' | 'cancelled'
    start_date: string
    end_date: string
    subscription_name: string
    price: number
  } | null
}

export async function getCenterProfile(userId: number): Promise<CenterProfile> {
  const response = await fetch(`${API_BASE}/api/center/profile?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки профиля центра')
  }

  return data
}

export async function updateCenterProfile(params: {
  userId: number
  name: string
  short_description?: string | null
  full_description?: string | null
  city: string
  address: string
  landmark?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  telegram?: string | null
  whatsapp?: string | null
  vk?: string | null
  logo_url?: string | null
  photo_url?: string | null
}): Promise<CenterProfile> {
  const response = await fetch(`${API_BASE}/api/center/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка сохранения профиля центра')
  }

  return data
}

export async function getCenterDashboard(
  userId: number
): Promise<CenterDashboardResponse> {
  const response = await fetch(`${API_BASE}/api/center/dashboard?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки дашборда центра')
  }

  return data
}