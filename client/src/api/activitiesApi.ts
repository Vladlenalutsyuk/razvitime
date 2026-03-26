import { API_BASE } from './config'

export type ActivitySession = {
  id: number
  activity_id: number
  weekday: number
  start_time: string
  end_time: string
}

export type Activity = {
  id: number
  title: string
  category: string
  age_min: number
  age_max: number
  short_description?: string | null
  description?: string | null
  price: number
  payment_type?: string
  capacity?: number | null
  center_id?: number
  center_name: string
  city: string
  address: string
  phone?: string | null
  email?: string | null
  website?: string | null
  logo_url?: string | null
  sessions?: ActivitySession[]
}

export type ActivitiesFilters = {
  city?: string
  age?: string | number
  category?: string
  search?: string
}

export async function getActivities(
  filters?: ActivitiesFilters
): Promise<Activity[]> {
  const params = new URLSearchParams()

  if (filters?.city) {
    params.set('city', String(filters.city))
  }

  if (filters?.age !== undefined && filters.age !== '') {
    params.set('age', String(filters.age))
  }

  if (filters?.category) {
    params.set('category', String(filters.category))
  }

  if (filters?.search) {
    params.set('search', String(filters.search))
  }

  const query = params.toString()
  const url = query
    ? `${API_BASE}/api/activities?${query}`
    : `${API_BASE}/api/activities`

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки кружков')
  }

  return data
}

export async function getActivityById(activityId: number): Promise<Activity> {
  const response = await fetch(`${API_BASE}/api/activities/${activityId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка загрузки кружка')
  }

  return data
}