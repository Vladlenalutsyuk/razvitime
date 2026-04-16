import { API_BASE } from './config'

export type PublicReview = {
  id: number
  type: 'parent' | 'center'
  author_name: string
  role: string | null
  text: string
  center_id: number | null
  center_name: string | null
}

export type PartnerCenter = {
  id: number
  name: string
  city: string
  short_description: string | null
  logo_url: string | null
}

export type PublicCenterActivity = {
  id: number
  title: string
  category: string
  age_min: number
  age_max: number
  short_description: string | null
  description: string | null
  price: number
  payment_type: 'monthly' | 'per_lesson' | 'free'
  is_active: boolean
  sessions?: Array<{
    id: number
    activity_id: number
    weekday: number
    start_time: string
    end_time: string
  }>
}

export type PublicCenterDetails = {
  id: number
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
  activities: PublicCenterActivity[]
}

export async function getPublishedReviews(
  type?: 'parent' | 'center'
): Promise<PublicReview[]> {
  const params = new URLSearchParams()

  if (type) {
    params.set('type', type)
  }

  const query = params.toString()
  const response = await fetch(
    `${API_BASE}/api/public/reviews${query ? `?${query}` : ''}`
  )
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить отзывы')
  }

  return data
}

export async function getPartnerCenters(): Promise<PartnerCenter[]> {
  const response = await fetch(`${API_BASE}/api/public/partners`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить центры')
  }

  return data
}

export async function getPublicCenterById(
  centerId: number
): Promise<PublicCenterDetails> {
  const response = await fetch(`${API_BASE}/api/public/centers/${centerId}`)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Не удалось загрузить страницу центра')
  }

  return data
}