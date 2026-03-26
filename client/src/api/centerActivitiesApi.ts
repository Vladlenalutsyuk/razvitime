import { API_BASE } from './config'

export type CenterActivitySession = {
  weekday: number
  start_time: string
  end_time: string
}

export type CenterActivity = {
  id: number
  center_id: number
  title: string
  category: string
  age_min: number
  age_max: number
  short_description: string | null
  description: string | null
  price: number
  payment_type: 'monthly' | 'per_lesson' | 'free'
  capacity: number | null
  is_active: number
  created_at?: string
}

export async function getCenterActivities(
  userId: number
): Promise<CenterActivity[]> {
  const response = await fetch(`${API_BASE}/api/center/activities?userId=${userId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки кружков центра')
  }

  return data
}

export async function createCenterActivity(params: {
  userId: number
  title: string
  category: string
  age_min: number
  age_max: number
  short_description?: string | null
  description?: string | null
  price?: number
  payment_type?: 'monthly' | 'per_lesson' | 'free'
  capacity?: number | null
  sessions?: CenterActivitySession[]
}): Promise<CenterActivity> {
  const response = await fetch(`${API_BASE}/api/center/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка создания кружка')
  }

  return data
}

export async function updateCenterActivity(
  activityId: number,
  params: {
    title: string
    category: string
    age_min: number
    age_max: number
    short_description?: string | null
    description?: string | null
    price?: number
    payment_type?: 'monthly' | 'per_lesson' | 'free'
    capacity?: number | null
    is_active?: boolean
    sessions?: CenterActivitySession[]
  }
): Promise<CenterActivity> {
  const response = await fetch(`${API_BASE}/api/center/activities/${activityId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка обновления кружка')
  }

  return data
}

export async function deleteCenterActivity(activityId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/center/activities/${activityId}`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка удаления кружка')
  }
}