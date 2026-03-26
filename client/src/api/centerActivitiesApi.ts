import { API_BASE } from './config'

export type CenterActivitySession = {
  id: number
  activity_id: number
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
  is_active: boolean
  sessions?: CenterActivitySession[]
}

export type CreateCenterActivityPayload = {
  userId: number
  title: string
  category: string
  age_min: number
  age_max: number
  short_description: string | null
  description: string | null
  price: number
  payment_type: 'monthly' | 'per_lesson' | 'free'
  capacity: number | null
  sessions: Array<{
    weekday: number
    start_time: string
    end_time: string
  }>
}

export type UpdateCenterActivityPayload = {
  title?: string
  category?: string
  age_min?: number
  age_max?: number
  short_description?: string | null
  description?: string | null
  price?: number
  payment_type?: 'monthly' | 'per_lesson' | 'free'
  capacity?: number | null
  is_active?: boolean
  sessions?: Array<{
    weekday: number
    start_time: string
    end_time: string
  }>
}

export async function getCenterActivities(
  userId: number
): Promise<CenterActivity[]> {
  const response = await fetch(
    `${API_BASE}/api/center/activities?userId=${userId}`
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить кружки центра')
  }

  return data
}

export async function createCenterActivity(
  payload: CreateCenterActivityPayload
): Promise<CenterActivity> {
  const response = await fetch(`${API_BASE}/api/center/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось создать кружок')
  }

  return data
}

export async function updateCenterActivity(
  activityId: number,
  payload: UpdateCenterActivityPayload
): Promise<CenterActivity> {
  const response = await fetch(
    `${API_BASE}/api/center/activities/${activityId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось обновить кружок')
  }

  return data
}

export async function deleteCenterActivity(activityId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE}/api/center/activities/${activityId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Не удалось удалить кружок')
  }
}